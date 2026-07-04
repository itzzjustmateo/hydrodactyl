<?php

namespace Pterodactyl\Models\Sorts;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Sorts\Sort;

class ServerNodeNameSort implements Sort
{
    public function __invoke(Builder $query, bool $descending, string $property)
    {
        $direction = $descending ? 'DESC' : 'ASC';

        $query->leftJoin('nodes', 'servers.node_id', '=', 'nodes.id')
            ->orderBy('nodes.name', $direction)
            ->select('servers.*');
    }
}
