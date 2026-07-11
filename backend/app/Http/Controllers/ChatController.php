<?php

namespace App\Http\Controllers;

use App\Events\ConversationNewMessage;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ChatController extends Controller
{
    public function main(?Conversation $conversation = null)
    {
        $user = Auth::user();
        $userId = $user->id;

        // Redirect guest users to their chat start page if no conversation is selected
        if ($user->isGuest() && !$conversation) {
            return redirect()->route('guest.chat.start');
        }

        $conversations = $this->getConversationsList($userId);

        $activeConversation = null;
        $messages = null;

        if ($conversation && $conversation->members()->where('user_id', $userId)->exists()) {
            $conversation->load('members:id,name,username,last_seen_at');
            $messages = $conversation->messages()
                ->with('sender:id,name,username')
                ->orderBy('created_at')
                ->paginate(50);

            $activeConversation = $conversation;
        }

        return Inertia::render('Chat/Main', [
            'conversations' => $conversations,
            'activeConversation' => $activeConversation,
            'messages' => $messages,
        ]);
    }

    private function getConversationsList($userId)
    {
        return Conversation::whereHas('members', fn($q) => $q->where('user_id', $userId))
            ->with(['members:id,name,username,last_seen_at'])
            ->with(['messages' => function ($q) {
                $q->latest()->take(1);
            }])
            ->withCount(['messages as unread_count' => function ($q) use ($userId) {
                $q->where('sender_id', '!=', $userId)->whereNull('read_at');
            }])
            ->get()
            ->map(function ($conv) use ($userId) {
                $lastMessage = $conv->messages->first();
                unset($conv->messages);

                $conv->last_message = $lastMessage;
                return $conv;
            })
            ->sortByDesc(function ($conv) {
                return $conv->last_message?->created_at ?? $conv->created_at;
            })
            ->values();
    }

    public function show(Conversation $conversation)
    {
        if (!$conversation->members()->where('user_id', Auth::id())->exists()) {
            abort(403);
        }

        $messages = $conversation->messages()
            ->with('sender:id,name,username')
            ->orderBy('created_at')
            ->paginate(50);

        $conversation->load('members:id,name,username,last_seen_at');

        return Inertia::render('Chat/Show', [
            'conversation' => $conversation,
            'messages' => $messages,
        ]);
    }

    public function messages(Conversation $conversation, Request $request)
    {
        if (!$conversation->members()->where('user_id', Auth::id())->exists()) {
            abort(403);
        }

        $messages = $conversation->messages()
            ->with('sender:id,name,username')
            ->orderBy('created_at')
            ->paginate(50);

        return response()->json($messages);
    }

    public function sendMessage(Request $request, Conversation $conversation)
    {
        if (!$conversation->members()->where('user_id', Auth::id())->exists()) {
            abort(403);
        }

        $request->validate([
            'isi_pesan' => 'required_without:file|string|nullable',
            'file' => ['nullable', 'file', 'max:20480', function ($attribute, $value, $fail) {
                $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'pdf', 'docx', 'xlsx', 'doc', 'xls', 'txt', 'csv'];
                $ext = strtolower($value->getClientOriginalExtension());
                if (!in_array($ext, $allowed)) {
                    $fail('Tipe file tidak didukung.');
                }
            }],
        ]);

        $messageData = [
            'conversation_id' => $conversation->id,
            'sender_id' => Auth::id(),
            'tipe_pesan' => 'text',
            'isi_pesan' => $request->isi_pesan,
        ];

        if ($request->hasFile('file')) {
            $file = $request->file('file');

            if ($file->isValid()) {
                // Read file metadata BEFORE moving
                $fileType = $file->getClientMimeType();
                $fileName = $file->getClientOriginalName();
                $fileSize = $file->getSize();
                $fileExt = $file->getClientOriginalExtension();

                // Use move() directly to bypass Laravel/Symfony filesystem (the
                // production server has no ext-fileinfo). public/storage is a symlink
                // to storage/app/public, so this lands in the same served location
                // as the "public" disk would.
                $relativeDir = 'uploads/' . date('Y/m/d') . '/' . Auth::id();
                $filename = uniqid() . '.' . $fileExt;
                $absoluteDir = public_path('storage/' . $relativeDir);

                if (!is_dir($absoluteDir)) {
                    mkdir($absoluteDir, 0755, true);
                }

                $file->move($absoluteDir, $filename);

                $path = $relativeDir . '/' . $filename;

                $messageData['tipe_pesan'] = 'file';
                $messageData['file_path'] = $path;
                $messageData['file_type'] = $fileType;
                $messageData['file_name'] = $fileName;
                $messageData['file_size'] = $fileSize;
            }
        }

        $message = Message::create($messageData);

        broadcast(new MessageSent($message))->toOthers();

        // Broadcast sidebar notification to all members (except sender)
        $members = $conversation->members()
            ->where('user_id', '!=', Auth::id())
            ->pluck('users.id');

        foreach ($members as $memberId) {
            broadcast(new ConversationNewMessage($memberId, $message));
        }

        if ($request->wantsJson()) {
            return response()->json($message->load('sender:id,name,username'));
        }

        return redirect()->back();
    }

    public function destroy(Conversation $conversation)
    {
        if (!$conversation->members()->where('user_id', Auth::id())->exists()) {
            abort(403);
        }

        // Only allow delete if user is creator or solo member (for personal chats)
        $memberCount = $conversation->members()->count();
        if ($memberCount > 1 && $conversation->tipe === 'personal') {
            // For personal chats with 2 people, just remove the current user
            $conversation->members()->detach(Auth::id());
        } else {
            // For groups or solo conversations, delete completely
            $conversation->messages()->delete();
            $conversation->members()->detach();
            $conversation->delete();
        }

        if (request()->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return redirect()->route('chat.main');
    }

    public function markAsRead(Conversation $conversation)
    {
        if (!$conversation->members()->where('user_id', Auth::id())->exists()) {
            abort(403);
        }

        Message::where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', Auth::id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function users()
    {
        $user = Auth::user();

        $query = User::where('id', '!=', $user->id)
            ->where('status_aktif', true);

        if ($user->isUserInternal()) {
            // Internal: hanya lihat admin, CS, dan internal lainnya
            $query->whereIn('role', [User::ROLE_ADMIN, User::ROLE_CUSTOMER_SERVICE, User::ROLE_USER_INTERNAL]);
        } elseif ($user->isRegularUser() || $user->isGuest()) {
            // User biasa / guest: hanya lihat customer service
            $query->where('role', User::ROLE_CUSTOMER_SERVICE);
        }
        // Admin / CS: lihat semua user aktif (tanpa filter tambahan)

        $users = $query->get(['id', 'name', 'username', 'role']);

        return response()->json($users);
    }

    public function createConversation(Request $request)
    {
        $request->validate([
            'tipe' => 'required|in:personal,grup',
            'nama_grup' => 'required_if:tipe,grup|string|nullable',
            'members' => 'required|array|min:1',
            'members.*' => 'exists:users,id',
        ]);

        $user = Auth::user();

        $allowedRoles = [];

        if ($user->isUserInternal()) {
            // Internal: hanya bisa chat dengan admin, CS, dan internal
            $allowedRoles = [User::ROLE_ADMIN, User::ROLE_CUSTOMER_SERVICE, User::ROLE_USER_INTERNAL];
        } elseif ($user->isRegularUser() || $user->isGuest()) {
            // User biasa / guest: hanya bisa chat dengan customer service
            if ($request->tipe !== 'personal') {
                return back()->withErrors(['tipe' => 'Percakapan hanya bisa dibuat dengan tipe personal.']);
            }
            $allowedRoles = [User::ROLE_CUSTOMER_SERVICE];
        }
        // Admin / CS: bisa chat dengan siapapun (allowedRoles tetap [] = tidak ada filter)

        if (!empty($allowedRoles)) {
            $notAllowed = User::whereIn('id', $request->members)
                ->whereNotIn('role', $allowedRoles)
                ->exists();

            if ($notAllowed) {
                return back()->withErrors(['members' => 'Anda tidak bisa memulai chat dengan user tersebut.']);
            }
        }

        $members = array_unique(array_merge($request->members, [Auth::id()]));

        // Check if personal conversation already exists between these two users
        if ($request->tipe === 'personal' && count($members) === 2) {
            $existing = Conversation::where('tipe', 'personal')
                ->whereHas('members', fn($q) => $q->where('user_id', $members[0]))
                ->whereHas('members', fn($q) => $q->where('user_id', $members[1]))
                ->whereDoesntHave('members', fn($q) => $q->whereNotIn('user_id', $members))
                ->first();

            if ($existing) {
                return redirect()->route('chat.main', $existing);
            }
        }

        $conversation = Conversation::create([
            'tipe' => $request->tipe,
            'nama_grup' => $request->nama_grup,
        ]);

        $conversation->members()->attach($members);

        return redirect()->route('chat.main', $conversation);
    }
}
