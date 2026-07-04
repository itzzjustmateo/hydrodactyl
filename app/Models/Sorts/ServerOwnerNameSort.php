<?php

namespace Pterodactyl\Models\Sorts;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Sorts\Sort;

class ServerOwnerNameSort implements Sort
{
    public function __invoke(Builder $query, bool $descending, string $property)
    {
        $direction = $descending ? 'DESC' : 'ASC';

        $query->leftJoin('users', 'servers.owner_id', '=', 'users.id')
            ->orderBy('users.name_first', $direction)
            ->orderBy('users.name_last', $direction)
            ->select('servers.*');
    }
}
