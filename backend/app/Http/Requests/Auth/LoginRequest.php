<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $loginType = $this->input('login_type', 'pasien');

        $rules = [
            'login_type' => ['required', 'in:pasien,petugas'],
        ];

        if ($loginType === 'petugas') {
            $rules['username'] = ['required', 'string'];
            $rules['password'] = ['required', 'string', 'min:8'];
            $rules['remember'] = ['boolean'];
        } else {
            $rules['no_rm'] = ['required', 'string'];
            $rules['captcha_answer'] = ['required', 'integer'];
        }

        return $rules;
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $loginType = $this->input('login_type', 'pasien');

        if ($loginType === 'petugas') {
            $this->authenticatePetugas();
        } else {
            $this->authenticatePasien();
        }
    }

    /**
     * Authenticate staff (admin, CS, internal) with username + password.
     */
    protected function authenticatePetugas(): void
    {
        $this->ensureIsNotRateLimited();

        if (! Auth::attempt($this->only('username', 'password'), $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'username' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Authenticate guest/pasien with no_rm only (no password).
     */
    protected function authenticatePasien(): void
    {
        $no_rm = $this->input('no_rm');

        $user = \App\Models\User::where('no_rm', $no_rm)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'no_rm' => 'No. Rekam Medis tidak ditemukan.',
            ]);
        }

        Auth::login($user);
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        $field = $this->input('login_type') === 'petugas' ? 'username' : 'no_rm';

        throw ValidationException::withMessages([
            $field => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        $identifier = $this->input('login_type') === 'petugas'
            ? $this->string('username')
            : $this->string('no_rm');

        return Str::transliterate(Str::lower($identifier).'|'.$this->ip());
    }
}
