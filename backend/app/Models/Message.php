<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    protected $fillable = [
        'conversation_id',
        'sender_id',
        'tipe_pesan',
        'isi_pesan',
        'file_path',
        'file_type',
        'file_name',
        'file_size',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
        'file_size' => 'integer',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
