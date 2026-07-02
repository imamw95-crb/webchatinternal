<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Illuminate\Http\Request::capture();
$response = $kernel->handle($request);

use App\Events\ConversationNewMessage;
use App\Events\MessageSent;
use App\Models\Message;
use Illuminate\Support\Facades\Broadcast;

// Check if we can resolve the broadcast manager
$broadcastManager = app(Illuminate\Broadcasting\BroadcastManager::class);
echo "Broadcast driver: " . config('broadcasting.default') . PHP_EOL;

// Send as User Satu (user_id=6) to conversation 3 (admin + user satu)
$message = Message::create([
    'conversation_id' => 3,
    'sender_id' => 6,
    'tipe_pesan' => 'text',
    'isi_pesan' => '🔴 Test realtime unread badge ' . date('H:i:s'),
]);

echo "Created message ID: " . $message->id . PHP_EOL;
echo "Broadcasting MessageSent to conversation.3..." . PHP_EOL;
broadcast(new MessageSent($message))->toOthers();

echo "Broadcasting ConversationNewMessage to admin (user 1)..." . PHP_EOL;
broadcast(new ConversationNewMessage(1, $message));

echo "Done!" . PHP_EOL;
