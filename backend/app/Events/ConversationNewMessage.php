<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationNewMessage implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $userId;
    public Message $message;

    public function __construct(int $userId, Message $message)
    {
        $this->userId = $userId;
        $this->message = $message->load('sender:id,name,username');
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('App.Models.User.' . $this->userId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'conversation.new.message';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->message->conversation_id,
            'sender_id' => $this->message->sender_id,
            'sender' => [
                'id' => $this->message->sender->id,
                'name' => $this->message->sender->name,
                'username' => $this->message->sender->username,
            ],
            'tipe_pesan' => $this->message->tipe_pesan,
            'isi_pesan' => $this->message->isi_pesan,
            'file_name' => $this->message->file_name,
            'created_at' => $this->message->created_at,
        ];
    }
}
