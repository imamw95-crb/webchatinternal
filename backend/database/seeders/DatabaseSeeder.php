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
            'role' => 'admin',
            'status_aktif' => true,
        ]);

        User::create([
            'name' => 'User Satu',
            'username' => 'user1',
            'nik' => '0002',
            'email' => 'user1@example.com',
            'password' => Hash::make('password123'),
            'role' => 'user',
            'status_aktif' => true,
        ]);

        User::create([
            'name' => 'User Dua',
            'username' => 'user2',
            'nik' => '0003',
            'email' => 'user2@example.com',
            'password' => Hash::make('password123'),
            'role' => 'user',
            'status_aktif' => true,
        ]);
    }
}
