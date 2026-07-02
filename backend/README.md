# Aplikasi Chat Multi-Platform (Laravel + React + PWA)

Aplikasi **web chat internal** yang bisa diakses dari **mobile, laptop, dan browser** (responsive web app / PWA).

## Tech Stack

- **Backend:** Laravel 13
- **Frontend:** Inertia.js + React
- **Real-time:** Laravel Reverb (WebSocket)
- **Database:** MySQL/PostgreSQL/SQLite
- **File Storage:** Laravel Storage (local per tanggal/user)
- **PWA:** manifest.json + Service Worker

## Fitur

- ✅ Autentikasi Username & Password (admin create)
- ✅ Chat 1-on-1 dan Grup
- ✅ Real-time messaging (Laravel Reverb)
- ✅ Status online/offline & last seen
- ✅ Read receipt (centang terkirim/dibaca)
- ✅ Riwayat chat tersimpan (pagination/infinite scroll)
- ✅ Drag & drop file upload (max 20MB)
- ✅ Preview file sebelum kirim
- ✅ Progress bar upload
- ✅ Validasi file (MIME type & ekstensi)
- ✅ Responsive design (mobile-first)
- ✅ PWA (Add to Home Screen)
- ✅ Service Worker (caching & offline dasar)
- ✅ Rate limiting (brute force protection)
- ✅ XSS prevention & input sanitasi

## Akun Demo (Seeder)

| Nama | Username | Password | Role |
|------|----------|----------|------|
| Admin | admin | admin123 | admin |
| User Satu | user1 | password123 | user |
| User Dua | user2 | password123 | user |

## Instalasi

```bash
# 1. Install dependencies
composer install
npm install --legacy-peer-deps

# 2. Copy .env & generate key
cp .env.example .env
php artisan key:generate

# 3. Konfigurasi database di .env (default: SQLite)
# DB_CONNECTION=sqlite

# 4. Jalankan migrasi & seeder
php artisan migrate --seed

# 5. Storage link
php artisan storage:link

# 6. Build frontend
npm run build

# 7. Jalankan server (development)
php artisan serve

# 8. Jalankan Reverb (terminal terpisah)
php artisan reverb:start

# 9. Jalankan queue worker (terminal terpisah)
php artisan queue:work
```

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

In addition, [Laracasts](https://laracasts.com) contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

You can also watch bite-sized lessons with real-world projects on [Laravel Learn](https://laravel.com/learn), where you will be guided through building a Laravel application from scratch while learning PHP fundamentals.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
