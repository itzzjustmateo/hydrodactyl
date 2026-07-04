<?php

namespace Pterodactyl\Models\Sorts;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Sorts\Sort;

class ServerNestNameSort implements Sort
{
    public function __invoke(Builder $query, bool $descending, string $property)
    {
        $direction = $descending ? 'DESC' : 'ASC';

        $query->leftJoin('nests', 'servers.nest_id', '=', 'nests.id')
            ->orderBy('nests.name', $direction)
            ->select('servers.*');
    }
}
