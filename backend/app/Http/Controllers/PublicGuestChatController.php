<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PublicGuestChatController extends Controller
{
    /**
     * Show the public guest chat form.
     */
    public function create()
    {
        // Generate simple math captcha
        $num1 = rand(1, 9);
        $num2 = rand(1, 9);
        $answer = $num1 + $num2;

        session()->put('captcha_answer', $answer);

        return Inertia::render('Guest/PublicChat', [
            'captcha' => [
                'num1' => $num1,
                'num2' => $num2,
            ],
        ]);
    }

    /**
     * Process the public guest chat initiation.
     * Creates a guest user, logs them in, and connects them to a CS agent.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'no_rm' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:20',
            'captcha_answer' => 'required|integer',
        ]);

        // Verify captcha
        $expected = session()->pull('captcha_answer');
        if ((int) $request->captcha_answer !== $expected) {
            return back()->withErrors(['captcha_answer' => 'Jawaban captcha salah. Silakan coba lagi.'])->withInput();
        }

        // Generate unique username and password
        $username = 'guest_' . Str::random(8) . '_' . time();
        $password = Str::random(16);

        // Create guest user (password cast handles hashing automatically)
        $guest = User::create([
            'name' => $request->name,
            'username' => $username,
            'no_rm' => $request->no_rm,
            'password' => $password,
            'role' => User::ROLE_GUEST,
            'status_aktif' => true,
        ]);

        // Log the guest in
        Auth::login($guest);

        // Find an available customerservice user (the one with fewest active conversations)
        $csUser = User::where('role', User::ROLE_CUSTOMER_SERVICE)
            ->where('status_aktif', true)
            ->withCount(['conversations' => function ($q) {
                $q->whereHas('messages', fn($m) => $m->where('created_at', '>=', now()->subDay()));
            }])
            ->orderBy('conversations_count')
            ->first();

        if (! $csUser) {
            // No CS available - still log them in and show error on chat page
            return redirect()->route('chat.main')
                ->withErrors(['message' => 'Tidak ada petugas customer service yang tersedia. Silakan coba lagi nanti.']);
        }

        // Check if conversation already exists between guest and this CS
        $existing = Conversation::where('tipe', 'personal')
            ->whereHas('members', fn($q) => $q->where('user_id', $guest->id))
            ->whereHas('members', fn($q) => $q->where('user_id', $csUser->id))
            ->whereDoesntHave('members', fn($q) => $q->whereNotIn('user_id', [$guest->id, $csUser->id]))
            ->first();

        if ($existing) {
            return redirect()->route('chat.main', $existing);
        }

        // Create new conversation
        $conversation = Conversation::create(['tipe' => 'personal']);
        $conversation->members()->attach([$guest->id, $csUser->id]);

        // Send welcome message from CS (guest will see it when chat page loads)
        \App\Models\Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $csUser->id,
            'tipe_pesan' => 'text',
            'isi_pesan' => "Halo {$request->name}! Selamat datang di layanan Chat Customer Service RSMP Patrol. Ada yang bisa kami bantu?",
        ]);

        return redirect()->route('chat.main', $conversation);
    }
}
