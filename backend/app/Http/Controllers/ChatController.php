<?php

namespace App\Http\Controllers;

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
        $userId = Auth::id();

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
            ->with(['members:id,name,username,last_seen_at', 'messages' => function ($q) {
                $q->latest()->take(1);
            }])
            ->get()
            ->map(function ($conv) use ($userId) {
                $lastMessage = $conv->messages->first();
                unset($conv->messages);

                $unreadCount = Message::where('conversation_id', $conv->id)
                    ->where('sender_id', '!=', $userId)
                    ->whereNull('read_at')
                    ->count();

                $conv->last_message = $lastMessage;
                $conv->unread_count = $unreadCount;
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

        if ($request->has('before')) {
            $messages = $conversation->messages()
                ->with('sender:id,name,username')
                ->where('id', '<', $request->before)
                ->orderBy('created_at')
                ->paginate(50);
        }

        return response()->json($messages);
    }

    public function sendMessage(Request $request, Conversation $conversation)
    {
        if (!$conversation->members()->where('user_id', Auth::id())->exists()) {
            abort(403);
        }

        $request->validate([
            'isi_pesan' => 'required_without:file|string|nullable',
            'file' => 'nullable|file|max:20480|mimes:jpg,jpeg,png,pdf,docx,xlsx,doc,xls,txt,csv',
        ]);

        $messageData = [
            'conversation_id' => $conversation->id,
            'sender_id' => Auth::id(),
            'tipe_pesan' => 'text',
            'isi_pesan' => $request->isi_pesan,
        ];

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('uploads/' . date('Y/m/d') . '/' . Auth::id(), 'public');

            $messageData['tipe_pesan'] = 'file';
            $messageData['file_path'] = $path;
            $messageData['file_type'] = $file->getMimeType();
            $messageData['file_name'] = $file->getClientOriginalName();
            $messageData['file_size'] = $file->getSize();
        }

        $message = Message::create($messageData);

        broadcast(new MessageSent($message))->toOthers();

        if ($request->wantsJson()) {
            return response()->json($message->load('sender:id,name,username'));
        }

        return redirect()->back();
    }

    public function createConversation(Request $request)
    {
        $request->validate([
            'tipe' => 'required|in:personal,grup',
            'nama_grup' => 'required_if:tipe,grup|string|nullable',
            'members' => 'required|array|min:1',
            'members.*' => 'exists:users,id',
        ]);

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
        $users = User::where('id', '!=', Auth::id())
            ->where('status_aktif', true)
            ->get(['id', 'name', 'username']);

        return response()->json($users);
    }
}
