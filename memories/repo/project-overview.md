# APP Chat Internal RSMP Patrol

**Stack:** Laravel 13.x | React 18 + Inertia v2 | Tailwind 3 | Reverb+Echo | MySQL | Sanctum | Vite 8

**HANYA `backend/` YANG DIPAKAI.** frontend/ & backend2/ kosong. Semua artisan/cmd dari `backend/`.

`backend/` structure:
- `app/Events/` — MessageSent broadcast
- `app/Http/Controllers/` — ChatController, ProfileController, Auth
- `app/Http/Middleware/` — HandleInertiaRequests, UpdateLastSeen
- `app/Models/` — User, Conversation, Message, ConversationMember
- `bootstrap/app.php` — middleware stack, CSRF例外
- `config/` — all config
- `database/migrations/` — 5 migrations
- `database/seeders/` — 3 seed users
- `resources/js/` — React frontend
- `resources/views/` — Blade layout (app.blade.php)
- `routes/` — web, channels, auth, console
- `public/` — assets, PWA (sw.js, manifest.json)
- `storage/` — uploads, logs

**Critical Rules:**
1. ALL work in `backend/` — NEVER create files in root, frontend/, backend2/
2. Run artisan from `backend/` dir
3. React source = `backend/resources/js/`
4. File uploads = `backend/storage/app/public/uploads/`
5. Build: `cd backend && npm run build`
6. Queue/Cache/Session driver = database (MySQL)
