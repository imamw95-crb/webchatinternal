# Real-time: Reverb + Echo

## Start / Restart

**Reverb:** localhost:8080(http) | appId=127610 key=f4qprjjudv8uo9wlkxmh secret=ucwpb0n5qw8hdlhcqm4d

```bash
cd backend
php artisan reverb:start --debug
```

> ⚠️ **Reverb harus dijalankan ulang setiap kali Laragon/komputer restart.** Tidak auto-start. Jika realtime chat mati (koneksi WebSocket refused), cek dengan `netstat -ano | findstr :8080` lalu jalankan perintah di atas.

**Echo** (`resources/js/bootstrap.js`): broadcaster=reverb, lazy init via `window.initializeEcho()`, auth endpoint `/broadcasting/auth`

**Event MessageSent** (`App\Events\MessageSent`): ShouldBroadcastNow(sync), PrivateChannel `conversation.{id}`, broadcastAs `message.sent`, excludes sender via `->toOthers()`
Broadcasts: id, conversation_id, sender_id, sender{id,name,username}, tipe_pesan, isi_pesan, file_path/type/name/size, read_at, created_at

**File upload:** max 20MB, types=jpg/jpeg/png/pdf/docx/xlsx/doc/xls/txt/csv, stored at `storage/app/public/uploads/Y/m/d/{userId}/`
