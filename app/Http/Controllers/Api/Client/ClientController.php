<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Pterodactyl\Models\Server;
use Pterodactyl\Models\Permission;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Pterodactyl\Models\Filters\MultiFieldServerFilter;
use Pterodactyl\Models\Sorts\ServerOwnerNameSort;
use Pterodactyl\Models\Sorts\ServerNestNameSort;
use Pterodactyl\Models\Sorts\ServerEggNameSort;
use Pterodactyl\Models\Sorts\ServerNodeNameSort;
use Pterodactyl\Transformers\Api\Client\ServerTransformer;
use Pterodactyl\Http\Requests\Api\Client\GetServersRequest;

class ClientController extends ClientApiController
{
    /**
     * Return all the servers available to the client making the API
     * request, including servers the user has access to as a subuser.
     */
    public function index(GetServersRequest $request): array
    {
        $user = $request->user();
        $transformer = $this->getTransformer(ServerTransformer::class);

        // Start the query builder and ensure we eager load any requested relationships from the request.
        $builder = QueryBuilder::for(
            Server::query()->with($this->getIncludesForTransformer($transformer, ['node']))
        )->allowedFilters([
            'uuid',
            'name',
            'description',
            'external_id',
            'daemonType',
            'owner_id',
            'nest_id',
            'egg_id',
            'node_id',
            AllowedFilter::custom('*', new MultiFieldServerFilter()),
        ])->allowedSorts([
            'name',
            'uuid',
            'uuidShort',
            'description',
            'status',
            'owner_id',
            'nest_id',
            'egg_id',
            'node_id',
            'memory',
            'disk',
            'cpu',
            'created_at',
            'updated_at',
            AllowedSort::custom('owner_name', new ServerOwnerNameSort()),
            AllowedSort::custom('nest_name', new ServerNestNameSort()),
            AllowedSort::custom('egg_name', new ServerEggNameSort()),
            AllowedSort::custom('node_name', new ServerNodeNameSort()),
        ]);

        $type = $request->input('type');
        // Either return all the servers the user has access to because they are an admin `?type=admin` or
        // just return all the servers the user has access to because they are the owner or a subuser of the
        // server. If ?type=admin-all is passed all servers on the system will be returned to the user, rather
        // than only servers they can see because they are an admin.
        if (in_array($type, ['admin', 'admin-all'])) {
            // If they aren't an admin but want all the admin servers don't fail the request, just
            // make it a query that will never return any results back.
            if (!$user->root_admin) {
                $builder->whereRaw('1 = 2');
            } else {
                $builder = $type === 'admin-all'
                    ? $builder
                    : $builder->whereNotIn('servers.id', $user->accessibleServers()->pluck('id')->all());
            }
        } elseif ($type === 'owner') {
            $builder = $builder->where('servers.owner_id', $user->id);
        } elseif ($type === 'all') {
            $builder = $builder->whereIn('servers.id', $user->accessibleServers()->pluck('id')->all());
        } else {
            $builder = $builder->whereIn('servers.id', $user->accessibleServers()->pluck('id')->all());
        }

        $servers = $builder->paginate(min($request->query('per_page', 50), 100))->appends($request->query());

        return $this->fractal->transformWith($transformer)->collection($servers)->toArray();
    }

    /**
     * Returns distinct filter options (owners, nests, eggs, nodes) for servers
     * accessible to the current user. Used to populate the category filter dropdown.
     */
    public function filterOptions(GetServersRequest $request): array
    {
        $user = $request->user();

        $baseQuery = Server::query();
        if (!$user->root_admin) {
            $baseQuery->whereIn('servers.id', $user->accessibleServers()->pluck('id')->all());
        }

        $owners = (clone $baseQuery)
            ->leftJoin('users', 'servers.owner_id', '=', 'users.id')
            ->select('users.id as value', \Illuminate\Support\Facades\DB::raw("CONCAT(users.name_first, ' ', users.name_last) as label"))
            ->whereNotNull('users.id')
            ->distinct()
            ->orderBy('users.name_first')
            ->orderBy('users.name_last')
            ->get();

        $nests = (clone $baseQuery)
            ->leftJoin('nests', 'servers.nest_id', '=', 'nests.id')
            ->select('nests.id as value', 'nests.name as label')
            ->whereNotNull('nests.id')
            ->distinct()
            ->orderBy('nests.name')
            ->get();

        $eggs = (clone $baseQuery)
            ->leftJoin('eggs', 'servers.egg_id', '=', 'eggs.id')
            ->select('eggs.id as value', 'eggs.name as label')
            ->whereNotNull('eggs.id')
            ->distinct()
            ->orderBy('eggs.name')
            ->get();

        $nodes = (clone $baseQuery)
            ->leftJoin('nodes', 'servers.node_id', '=', 'nodes.id')
            ->select('nodes.id as value', 'nodes.name as label')
            ->whereNotNull('nodes.id')
            ->distinct()
            ->orderBy('nodes.name')
            ->get();

        return [
            'object' => 'server_filter_options',
            'attributes' => [
                'owners' => $owners,
                'nests' => $nests,
                'eggs' => $eggs,
                'nodes' => $nodes,
            ],
        ];
    }

    /**
     * Returns all the subuser permissions available on the system.
     */
    public function permissions(): array
    {
        return [
            'object' => 'system_permissions',
            'attributes' => [
                'permissions' => Permission::permissions(),
            ],
        ];
    }
}
