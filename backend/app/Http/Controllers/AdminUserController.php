<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', Rule::in(User::ROLES)],
            'status_aktif' => ['boolean'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['username'] . '@chat.internal',
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'status_aktif' => $validated['status_aktif'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil ditambahkan',
            'user' => $user,
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', Rule::unique('users', 'username')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:6'],
            'role' => ['required', Rule::in(User::ROLES)],
            'status_aktif' => ['boolean'],
        ]);

        $data = [
            'name' => $validated['name'],
            'username' => $validated['username'],
            'role' => $validated['role'],
            'status_aktif' => $validated['status_aktif'] ?? $user->status_aktif,
        ];

        // Only update email if username changed
        if ($validated['username'] !== $user->username) {
            $data['email'] = $validated['username'] . '@chat.internal';
        }

        // Only update password if provided
        if (!empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil diperbarui',
            'user' => $user->fresh(),
        ]);
    }
}
