<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Ramsey\Uuid\Uuid;
use Pterodactyl\Models\User;
use Illuminate\Database\Seeder;

class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(['email' => 'admin@hydrodactyl.dev'], [
            'uuid' => Uuid::uuid4()->toString(),
            'username' => 'admin',
            'email' => 'admin@hydrodactyl.dev',
            'name_first' => 'Admin',
            'name_last' => 'User',
            'password' => bcrypt('admin'),
            'language' => 'en',
            'root_admin' => true,
            'use_totp' => false,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        User::query()->updateOrCreate(['email' => 'test@hydrodactyl.dev'], [
            'uuid' => Uuid::uuid4()->toString(),
            'username' => 'test',
            'email' => 'test@hydrodactyl.dev',
            'name_first' => 'Test',
            'name_last' => 'User',
            'password' => bcrypt('test'),
            'language' => 'en',
            'root_admin' => false,
            'use_totp' => false,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);
    }
}
