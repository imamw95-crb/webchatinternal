# Project: APP Chat Internal RSMP Patrol

## Tech Stack
- **Backend**: Laravel 13.x (PHP 8.3+)
- **Frontend**: React 18 + Inertia.js + Tailwind CSS
- **Real-time**: Laravel Reverb (WebSocket) + Laravel Echo + Pusher.js
- **Database**: MySQL (single DB `chat`)
- **Auth**: Custom username-based + Sanctum API tokens
- **Build**: Vite + Laravel Vite plugin
- **Queue**: Database-based queue
- **Cache**: Database-based cache
- **Session**: Database-based session
- **PWA**: Service worker + manifest.json

## Directory Structure
```
chat/
├── backend/          ← Main Laravel application (work here)
├── frontend/         ← Empty (not used)
├── backend2/         ← Empty (not used)
├── composer.json     ← Root deps (breeze, sanctum)
├── vendor/           ← Root vendor
```

## Project Conventions
- All Laravel code is in `backend/` directory
- Run `artisan` from `backend/` directory: `php artisan ...`
- Frontend source is in `backend/resources/js/`
- Views are in `backend/resources/views/`
- Routes are in `backend/routes/`
- Storage is at `backend/storage/`

## Key Environment
- DB: MySQL, database `chat`, user `root`, no password
- Reverb: WS on localhost:8080
- Session driver: database
- Queue driver: database
- Cache driver: database
