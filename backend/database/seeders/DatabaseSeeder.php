<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::create([
            'name' => 'Admin',
            'username' => 'admin',
            'nik' => '0001',
            'email' => 'admin@example.com',
            'password' => Hash::make('admin123'),
            'role' => User::ROLE_ADMIN,
            'status_aktif' => true,
        ]);

        User::create([
            'name' => 'Customer Service Satu',
            'username' => 'cs1',
            'nik' => '0002',
            'email' => 'cs1@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_CUSTOMER_SERVICE,
            'status_aktif' => true,
        ]);

        User::create([
            'name' => 'Customer Service Dua',
            'username' => 'cs2',
            'nik' => '0003',
            'email' => 'cs2@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_CUSTOMER_SERVICE,
            'status_aktif' => true,
        ]);

        User::create([
            'name' => 'User Internal Satu',
            'username' => 'internal1',
            'nik' => '0004',
            'email' => 'internal1@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_USER_INTERNAL,
            'status_aktif' => true,
        ]);

        User::create([
            'name' => 'User Internal Dua',
            'username' => 'internal2',
            'nik' => '0005',
            'email' => 'internal2@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_USER_INTERNAL,
            'status_aktif' => true,
        ]);

        User::create([
            'name' => 'User Satu',
            'username' => 'user1',
            'nik' => '0006',
            'email' => 'user1@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_USER,
            'status_aktif' => true,
        ]);

        User::create([
            'name' => 'User Dua',
            'username' => 'user2',
            'nik' => '0007',
            'email' => 'user2@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_USER,
            'status_aktif' => true,
        ]);

        User::create([
            'name' => 'Guest Satu',
            'username' => 'guest1',
            'nik' => '0008',
            'no_rm' => 'RM-2026-0001',
            'email' => 'guest1@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_GUEST,
            'status_aktif' => true,
        ]);

        User::create([
            'name' => 'Guest Dua',
            'username' => 'guest2',
            'nik' => '0009',
            'no_rm' => 'RM-2026-0002',
            'email' => 'guest2@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_GUEST,
            'status_aktif' => true,
        ]);
    }
}
