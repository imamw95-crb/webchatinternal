<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        // Generate simple math captcha
        $num1 = rand(1, 9);
        $num2 = rand(1, 9);
        $answer = $num1 + $num2;

        session()->put('login_captcha_answer', $answer);

        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'captcha' => [
                'num1' => $num1,
                'num2' => $num2,
            ],
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        // Verify captcha only for pasien login
        if ($request->input('login_type') === 'pasien') {
            $expected = session()->pull('login_captcha_answer');
            if ((int) $request->captcha_answer !== $expected) {
                return back()->withErrors(['captcha_answer' => 'Jawaban captcha salah. Silakan coba lagi.'])->withInput();
            }
        }

        $request->authenticate();

        $request->session()->regenerate();

        $user = Auth::user();

        // If user logged in via no_rm but is not a guest (e.g., admin/CS with no_rm set),
        // redirect to chat instead
        if ($request->input('login_type') === 'pasien' && !$user->isGuest()) {
            return redirect()->intended(route('chat.main', absolute: false));
        }

        // Redirect guest users to the guest chat start page
        if ($user->isGuest()) {
            return redirect()->intended(route('guest.chat.start', absolute: false));
        }

        // Redirect patients (user role with no_rm) and CS/internal users to chat
        if ($user->isRegularUser() || $user->isCustomerService() || $user->isUserInternal()) {
            return redirect()->intended(route('chat.main', absolute: false));
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
