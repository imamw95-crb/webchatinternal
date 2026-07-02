<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class GuestChatController extends Controller
{
    /**
     * Show the guest chat initiation form.
     */
    public function start()
    {
        // If guest already has a conversation with customerservice, redirect to it
        $existingConv = Conversation::where('tipe', 'personal')
            ->whereHas('members', fn($q) => $q->where('user_id', Auth::id()))
            ->whereHas('members', fn($q) => $q->whereIn('user_id', function ($q) {
                $q->select('id')->from('users')->where('role', User::ROLE_CUSTOMER_SERVICE)->where('status_aktif', true);
            }))
            ->first();

        if ($existingConv) {
            return redirect()->route('chat.main', $existingConv);
        }

        return Inertia::render('Guest/StartChat');
    }

    /**
     * Process the guest chat initiation.
     */
    public function initiate(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'no_rm' => 'required|string|max:50',
        ]);

        $user = Auth::user();

        // Update guest user profile
        $user->update([
            'name' => $request->name,
            'no_rm' => $request->no_rm,
        ]);

        // Find an available customerservice user (the one with fewest active conversations)
        $csUser = User::where('role', User::ROLE_CUSTOMER_SERVICE)
            ->where('status_aktif', true)
            ->withCount(['conversations' => function ($q) {
                $q->whereHas('messages', fn($m) => $m->where('created_at', '>=', now()->subDay()));
            }])
            ->orderBy('conversations_count')
            ->first();

        if (! $csUser) {
            return back()->withErrors(['message' => 'Tidak ada petugas customer service yang tersedia. Silakan coba lagi nanti.']);
        }

        // Check if conversation already exists between guest and this CS
        $existing = Conversation::where('tipe', 'personal')
            ->whereHas('members', fn($q) => $q->where('user_id', $user->id))
            ->whereHas('members', fn($q) => $q->where('user_id', $csUser->id))
            ->whereDoesntHave('members', fn($q) => $q->whereNotIn('user_id', [$user->id, $csUser->id]))
            ->first();

        if ($existing) {
            return redirect()->route('chat.main', $existing);
        }

        // Create new conversation
        $conversation = Conversation::create(['tipe' => 'personal']);
        $conversation->members()->attach([$user->id, $csUser->id]);

        return redirect()->route('chat.main', $conversation);
    }
}
