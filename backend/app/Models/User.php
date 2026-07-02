<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'username', 'nik', 'no_rm', 'email', 'password', 'role', 'status_aktif', 'last_seen_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    public const string ROLE_ADMIN = 'admin';
    public const string ROLE_CUSTOMER_SERVICE = 'customerservice';
    public const string ROLE_USER_INTERNAL = 'userinternal';
    public const string ROLE_USER = 'user';
    public const string ROLE_GUEST = 'guest';

    public const array ROLES = [
        self::ROLE_ADMIN,
        self::ROLE_CUSTOMER_SERVICE,
        self::ROLE_USER_INTERNAL,
        self::ROLE_USER,
        self::ROLE_GUEST,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'password' => 'hashed',
            'status_aktif' => 'boolean',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isCustomerService(): bool
    {
        return $this->role === self::ROLE_CUSTOMER_SERVICE;
    }

    public function isUserInternal(): bool
    {
        return $this->role === self::ROLE_USER_INTERNAL;
    }

    public function isRegularUser(): bool
    {
        return $this->role === self::ROLE_USER;
    }

    public function isGuest(): bool
    {
        return $this->role === self::ROLE_GUEST;
    }

    public function hasRole(string|array $roles): bool
    {
        if (is_string($roles)) {
            return $this->role === $roles;
        }

        return in_array($this->role, $roles, true);
    }

    /**
     * Find user by username for authentication.
     */
    public function findForPassport(string $username): self
    {
        return self::where('username', $username)->first();
    }

    public function conversations(): BelongsToMany
    {
        return $this->belongsToMany(Conversation::class, 'conversation_members')
            ->withPivot('joined_at')
            ->withTimestamps();
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }
}
