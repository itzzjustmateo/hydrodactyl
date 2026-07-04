<?php

namespace Pterodactyl\Models\Sorts;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Sorts\Sort;

class ServerEggNameSort implements Sort
{
    public function __invoke(Builder $query, bool $descending, string $property)
    {
        $direction = $descending ? 'DESC' : 'ASC';

        $query->leftJoin('eggs', 'servers.egg_id', '=', 'eggs.id')
            ->orderBy('eggs.name', $direction)
            ->select('servers.*');
    }
}
