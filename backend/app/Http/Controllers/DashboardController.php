<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Show the admin dashboard.
     */
    public function index()
    {
        $user = Auth::user();

        // Overview stats
        $totalUsers = User::count();
        $totalConversations = Conversation::count();
        $totalMessages = Message::count();
        $activeToday = User::where('last_seen_at', '>=', now()->subDay())->count();

        // Messages per day (last 14 days)
        $messagesPerDay = Message::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as count')
        )
            ->where('created_at', '>=', now()->subDays(13)->startOfDay())
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        // Fill missing days with 0
        $dates = collect();
        for ($i = 13; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $dates->push([
                'date' => $date,
                'count' => (int) ($messagesPerDay[$date]->count ?? 0),
            ]);
        }

        // Users by role
        $usersByRole = User::select('role', DB::raw('COUNT(*) as count'))
            ->groupBy('role')
            ->orderBy('count', 'desc')
            ->get();

        // Conversations per day (last 14 days)
        $conversationsPerDay = Conversation::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as count')
        )
            ->where('created_at', '>=', now()->subDays(13)->startOfDay())
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $convDates = collect();
        for ($i = 13; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $convDates->push([
                'date' => $date,
                'count' => (int) ($conversationsPerDay[$date]->count ?? 0),
            ]);
        }

        return Inertia::render('Dashboard', [
            'stats' => [
                'totalUsers' => $totalUsers,
                'totalConversations' => $totalConversations,
                'totalMessages' => $totalMessages,
                'activeToday' => $activeToday,
            ],
            'messagesPerDay' => $dates,
            'usersByRole' => $usersByRole,
            'conversationsPerDay' => $convDates,
            'isAdmin' => $user->isAdmin(),
        ]);
    }

    /**
     * List all users (admin only).
     */
    public function users(Request $request)
    {
        $query = User::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('nik', 'like', "%{$search}%")
                  ->orWhere('no_rm', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        $users = $query->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($users);
    }

    /**
     * List all conversations (admin only - for peeking).
     */
    public function conversations(Request $request)
    {
        $query = Conversation::with([
            'members:id,name,username,role,last_seen_at',
            'messages' => function ($q) {
                $q->latest()->take(1);
            },
        ]);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_grup', 'like', "%{$search}%")
                  ->orWhereHas('members', function ($mq) use ($search) {
                      $mq->where('name', 'like', "%{$search}%")
                         ->orWhere('username', 'like', "%{$search}%");
                  });
            });
        }

        $conversations = $query->orderBy('updated_at', 'desc')
            ->paginate(20)
            ->through(function ($conv) {
                $lastMessage = $conv->messages->first();
                unset($conv->messages);
                $conv->last_message = $lastMessage;
                return $conv;
            });

        return response()->json($conversations);
    }

    /**
     * Get messages from a specific conversation (admin peeking).
     */
    public function peekConversation(Conversation $conversation)
    {
        $conversation->load('members:id,name,username,role,last_seen_at');

        $messages = $conversation->messages()
            ->with('sender:id,name,username,role')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json([
            'conversation' => $conversation,
            'messages' => $messages,
        ]);
    }

    /**
     * Get chat usage statistics.
     */
    public function stats()
    {
        // Messages per user (top 10)
        $topChatters = Message::select(
            'sender_id',
            DB::raw('COUNT(*) as count')
        )
            ->with('sender:id,name,username,role')
            ->groupBy('sender_id')
            ->orderBy('count', 'desc')
            ->take(10)
            ->get();

        // Active hours distribution
        $messagesByHour = Message::select(
            DB::raw('HOUR(created_at) as hour'),
            DB::raw('COUNT(*) as count')
        )
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        return response()->json([
            'topChatters' => $topChatters,
            'messagesByHour' => $messagesByHour,
        ]);
    }

    /**
     * Toggle user active status (admin only).
     */
    public function toggleUserStatus(User $user)
    {
        $user->update([
            'status_aktif' => !$user->status_aktif,
        ]);

        return response()->json([
            'success' => true,
            'status_aktif' => $user->status_aktif,
        ]);
    }

    /**
     * Update user role (admin only).
     */
    public function updateUserRole(Request $request, User $user)
    {
        $request->validate([
            'role' => ['required', 'in:' . implode(',', User::ROLES)],
        ]);

        $user->update([
            'role' => $request->role,
        ]);

        return response()->json([
            'success' => true,
            'role' => $user->role,
        ]);
    }
}
