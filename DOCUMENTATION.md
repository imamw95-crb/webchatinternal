# APP Chat Internal RSMP Patrol — Dokumentasi Lengkap

> **Versi Aplikasi:** 1.0.0  
> **Framework:** Laravel 13.x + React 18 (Inertia.js)  
> **Last Updated:** 2026-07-08

---

## Daftar Isi

1. [📋 Gambaran Umum](#1-📋-gambaran-umum)
2. [🏗️ Arsitektur Aplikasi](#2-🏗️-arsitektur-aplikasi)
3. [👥 Sistem Role & Autentikasi](#3-👥-sistem-role--autentikasi)
4. [📊 Struktur Database](#4-📊-struktur-database)
5. [🌐 Routes & API Endpoints](#5-🌐-routes--api-endpoints)
6. [💬 Fitur Chat](#6-💬-fitur-chat)
7. [⚡ Real-time Broadcasting (Reverb)](#7-⚡-real-time-broadcasting-reverb)
8. [🎨 Frontend (React + Inertia)](#8-🎨-frontend-react--inertia)
9. [📱 PWA & Mobile](#9-📱-pwa--mobile)
10. [🖥️ Desktop App (Electron)](#10-🖥️-desktop-app-electron)
11. [🤖 Android APK (Capacitor)](#11-🤖-android-apk-capacitor)
12. [🌍 Deployment & Infrastruktur](#12-🌍-deployment--infrastruktur)
13. [🔧 Developer Guide](#13-🔧-developer-guide)

---

## 1. 📋 Gambaran Umum

Aplikasi **APP Chat Internal RSMP Patrol** adalah sistem chatting internal untuk Rumah Sakit. Aplikasi ini memungkinkan:

- **Customer Service (CS)** melayani chat dari pasien/guest
- **User Internal** berkomunikasi antar karyawan RS
- **Pasien/Guest** mengirim pesan ke CS melalui tautan atau QR code
- **Admin** memantau seluruh percakapan dan mengelola pengguna

### Tech Stack

| Komponen | Teknologi |
|---|---|
| **Backend** | Laravel 13.x (PHP 8.3+) |
| **Frontend** | React 18 + Inertia.js |
| **CSS** | Tailwind CSS 3.x |
| **Real-time** | Laravel Reverb (WebSocket) + Pusher Protocol |
| **Database** | MySQL (single DB `chat`) |
| **Auth** | Custom username/Nomor RM + Sanctum API Tokens |
| **Build** | Vite + Laravel Vite Plugin |
| **Queue** | Database-based |
| **Cache** | Database-based |
| **Session** | Database-based |
| **PWA** | Service Worker + manifest.json |

### Struktur Direktori

```
chat/
├── backend/                  ← Main Laravel application
│   ├── app/
│   │   ├── Events/           ← Broadcasting events (MessageSent, ConversationNewMessage)
│   │   ├── Http/
│   │   │   ├── Controllers/  ← Application controllers
│   │   │   ├── Middleware/    ← Custom middleware (Role, UpdateLastSeen)
│   │   │   └── Requests/     ← Form request validation
│   │   ├── Models/           ← Eloquent models
│   │   ├── Policies/         ← Authorization policies
│   │   └── Providers/        ← Service providers
│   ├── bootstrap/            ← App bootstrap & middleware config
│   ├── config/               ← Application configuration
│   ├── database/
│   │   ├── migrations/       ← Database migrations
│   │   └── seeders/          ← Database seeders
│   ├── public/               ← Public assets (build, icons, APK)
│   ├── resources/
│   │   ├── js/               ← React frontend source
│   │   └── views/            ← Blade views
│   ├── routes/               ← Route definitions
│   ├── storage/              ← Storage (logs, cache, uploaded files)
│   └── android/              ← Capacitor Android project
├── desktop/                  ← Electron desktop app
├── frontend/                 ← (Tidak digunakan)
├── backend2/                 ← (Tidak digunakan)
├── vendor/                   ← Root vendor (Carbon, dll)
├── composer.json             ← Root composer
└── package.json              ← Root package
```

---

## 2. 🏗️ Arsitektur Aplikasi

### Data Flow

```
Pelanggan / Customer
     │
     ├── Tautan Chat (Link/QR)
     │
     ▼
┌──────────────────────────────────┐
│  Cloudflare Tunnel (Edge)         │
│  - SSL/TLS termination            │
│  - DDoS protection                │
│  - WebSocket support              │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  Apache Web Server (:80)          │
│  (aaPanel)                        │
│  Host: chat.cloudnod.my.id        │
└──────────┬───────────────────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐ ┌─────────┐
│  CS 1   │ │  CS 2   │
│ (Agent) │ │ (Agent) │
└─────────┘ └─────────┘
     │           │
     └─────┬─────┘
           │
           ▼
┌──────────────────────────────────┐
│  Internal Server                  │
│  - Laravel App (Reverb WS)        │
│  - MySQL Database                 │
│  - Queue (Database)               │
│  - Session (Database)             │
│  - Cache (Database)               │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  WhatsApp Business API            │
│  (Integrasi notifikasi/balas)     │
└──────────────────────────────────┘
```

### Komponen Arsitektur

| Lapisan | Teknologi | Keterangan |
|---|---|---|
| **CDN/Edge** | Cloudflare Tunnel | SSL termination, DDoS protection, WS proxy |
| **Web Server** | Apache (aaPanel) | Reverse proxy, port 80 |
| **App Server** | Laravel 13 / PHP 8.3 | Backend logic, Reverb WebSocket |
| **Database** | MySQL | Satu database `chat` |
| **Real-time** | Laravel Reverb + Pusher | WebSocket via port 8081 |
| **Agents** | CS1, CS2 | Customer service agents |
| **Integrasi** | WhatsApp Business API | Notifikasi dan balasan otomatis |

---

## 3. 👥 Sistem Role & Autentikasi

### Role Pengguna

| Role | Kode | Deskripsi |
|---|---|---|
| **Admin** | `admin` | Akses penuh ke dashboard, manajemen pengguna, intip chat |
| **Customer Service** | `customerservice` | Melayani chat dari pasien/guest |
| **User Internal** | `userinternal` | Komunikasi antar karyawan RS |
| **User / Pasien** | `user` | Pasien yang terdaftar |
| **Guest** | `guest` | Pengguna tamu (auto-generated) |

### Jenis Login

1. **Login Petugas** — Untuk `admin`, `customerservice`, `userinternal` menggunakan username + password
2. **Login Pasien** — Untuk `user` menggunakan Nomor Rekam Medis (No. RM) + password (dilengkapi captcha)
3. **Guest Chat (Public)** — Tanpa login, isi form nama + no_rm + telepon, langsung dibuatkan akun dan diarahkan ke chat

### Alur Autentikasi

```
Login Page (/login)
    │
    ├── Tab "Pasien"
    │   ├── Input: No. RM + Password + Captcha
    │   └── Redirect: /chat (full chat interface)
    │
    └── Tab "Petugas"
        ├── Input: Username + Password
        └── Redirect: /dashboard (CS) atau /chat (lainnya)
```

### Middleware

| Middleware | Fungsi |
|---|---|
| `RoleMiddleware` | `role:admin, customerservice` — Membatasi akses berdasarkan role |
| `UpdateLastSeen` | Update `last_seen_at` setiap request dari user terautentikasi |
| `HandleInertiaRequests` | Share `auth.user` ke semua halaman Inertia |

---

## 4. 📊 Struktur Database

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────────────┐       ┌──────────────┐
│    users    │       │  conversation_members    │       │ conversations │
├─────────────┤       ├─────────────────────────┤       ├──────────────┤
│ id          │──┐    │ id                      │    ┌──│ id           │
│ name        │  │    │ conversation_id (FK) ───┼────┘  │ tipe         │
│ username    │  │    │ user_id (FK) ───────────┼──┐    │ nama_grup    │
│ nik         │  │    │ joined_at               │  │    │ created_at   │
│ no_rm       │  │    │ created_at              │  │    │ updated_at   │
│ email       │  │    │ updated_at              │  │    └──────────────┘
│ password    │  │    └─────────────────────────┘  │
│ role        │  │                                 │
│ status_aktif│  │    ┌──────────────┐             │
│ last_seen_at│  │    │  messages    │             │
│ created_at  │  └────│──────────────│             │
│ updated_at  │       │ id          │             │
└─────────────┘       │ conversation_id (FK) ─────┘
                      │ sender_id (FK) ───────────┘
                      │ tipe_pesan (text/file)
                      │ isi_pesan
                      │ file_path
                      │ file_type
                      │ file_name
                      │ file_size
                      │ read_at
                      │ created_at
                      │ updated_at
                      └──────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  sessions    │    │    jobs      │    │    cache     │
├──────────────┤    ├──────────────┤    ├──────────────┤
│ id           │    │ id           │    │ key          │
│ user_id      │    │ queue        │    │ value        │
│ ip_address   │    │ payload      │    │ expiration   │
│ user_agent   │    │ attempts     │    └──────────────┘
│ payload      │    │ available_at │
│ last_activity│    │ created_at   │
└──────────────┘    └──────────────┘
```

### Tabel-Tabel

#### `users`
Menyimpan semua pengguna aplikasi.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint, AI | Primary key |
| `name` | varchar(255) | Nama lengkap |
| `username` | varchar(255) | Username login (petugas) |
| `nik` | varchar(255), nullable | NIK karyawan |
| `no_rm` | varchar(255), nullable | Nomor Rekam Medis (pasien) |
| `email` | varchar(255), nullable | Email |
| `password` | varchar(255) | Password (hashed) |
| `role` | varchar(255) | `admin`, `customerservice`, `userinternal`, `user`, `guest` |
| `status_aktif` | tinyint(1) | Status aktif/nonaktif |
| `last_seen_at` | timestamp, nullable | Last seen timestamp |
| `remember_token` | varchar(100), nullable | Remember me token |
| `timestamps` | - | created_at, updated_at |

#### `conversations`
Menyimpan percakapan.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint, AI | Primary key |
| `tipe` | varchar(255) | `personal` atau `grup` |
| `nama_grup` | varchar(255), nullable | Nama grup (jika tipe grup) |
| `timestamps` | - | created_at, updated_at |

#### `conversation_members`
Pivot table untuk anggota percakapan.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint, AI | Primary key |
| `conversation_id` | bigint, FK | Foreign key ke `conversations` |
| `user_id` | bigint, FK | Foreign key ke `users` |
| `joined_at` | datetime, nullable | Waktu bergabung |
| `timestamps` | - | created_at, updated_at |

**Unique constraint:** (`conversation_id`, `user_id`)

#### `messages`
Menyimpan pesan dalam percakapan.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint, AI | Primary key |
| `conversation_id` | bigint, FK | Foreign key ke `conversations` |
| `sender_id` | bigint, FK | Foreign key ke `users` |
| `tipe_pesan` | varchar(255) | `text` atau `file` |
| `isi_pesan` | text, nullable | Isi pesan teks |
| `file_path` | varchar(255), nullable | Path file upload |
| `file_type` | varchar(255), nullable | Tipe file (mime) |
| `file_name` | varchar(255), nullable | Nama file asli |
| `file_size` | bigint, nullable | Ukuran file (bytes) |
| `read_at` | timestamp, nullable | Waktu dibaca |
| `timestamps` | - | created_at, updated_at |

**Index:** (`conversation_id`, `created_at`)

#### `sessions`
Menyimpan session user.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | varchar(255) | Session ID |
| `user_id` | bigint, nullable | Foreign key ke `users` |
| `ip_address` | varchar(45), nullable | IP address |
| `user_agent` | text, nullable | User agent browser |
| `payload` | longtext | Data session |
| `last_activity` | int | Timestamp aktivitas terakhir |

#### `jobs`, `job_batches`, `failed_jobs`
Menyimpan antrian job (database-based queue).

#### `cache`, `cache_locks`
Menyimpan cache (database-based cache).

#### `password_reset_tokens`
Menyimpan token reset password.

---

## 5. 🌐 Routes & API Endpoints

### Public Routes (No Auth)

| Method | URI | Controller | Deskripsi |
|---|---|---|---|
| GET | `/` | Welcome page | Landing page |
| GET | `/guest-chat` | `PublicGuestChatController@create` | Form chat tamu publik |
| POST | `/guest-chat` | `PublicGuestChatController@store` | Submit chat tamu publik |
| GET | `/login` | `AuthenticatedSessionController@create` | Halaman login |
| POST | `/login` | `AuthenticatedSessionController@store` | Proses login |
| GET | `/forgot-password` | `PasswordResetLinkController@create` | Lupa password |
| POST | `/forgot-password` | `PasswordResetLinkController@store` | Kirim link reset |
| GET | `/reset-password/{token}` | `NewPasswordController@create` | Form reset password |
| POST | `/reset-password` | `NewPasswordController@store` | Proses reset password |

### Authenticated Routes (auth middleware)

#### Chat

| Method | URI | Controller | Deskripsi |
|---|---|---|---|
| GET | `/chat/{conversation?}` | `ChatController@main` | Halaman chat utama |
| GET | `/chat/{conversation}/messages` | `ChatController@messages` | JSON daftar pesan |
| POST | `/chat/{conversation}/send` | `ChatController@sendMessage` | Kirim pesan/file |
| POST | `/chat/{conversation}/read` | `ChatController@markAsRead` | Tandai sudah dibaca |
| POST | `/chat/create` | `ChatController@createConversation` | Buat percakapan baru |
| GET | `/chat/{conversation}` | `ChatController@show` | Lihat percakapan |
| DELETE | `/chat/{conversation}` | `ChatController@destroy` | Hapus/keluar percakapan |
| GET | `/users` | `ChatController@users` | Daftar user untuk chat baru |

#### Guest Chat (role: guest)

| Method | URI | Controller | Deskripsi |
|---|---|---|---|
| GET | `/guest/chat` | `GuestChatController@start` | Inisiasi chat guest |
| POST | `/guest/chat` | `GuestChatController@initiate` | Buat/arahkan ke CS |

#### Dashboard & Admin (role: admin)

| Method | URI | Controller | Deskripsi |
|---|---|---|---|
| GET | `/dashboard` | `DashboardController@index` | Dashboard ringkasan |
| GET | `/admin/users` | `DashboardController@users` | Manajemen pengguna |
| POST | `/admin/users` | `AdminUserController@store` | Tambah pengguna baru |
| PUT | `/admin/users/{user}` | `AdminUserController@update` | Update pengguna |
| GET | `/admin/conversations` | `DashboardController@conversations` | Daftar percakapan |
| GET | `/admin/conversations/{conv}/peek` | `DashboardController@peekConversation` | Intip percakapan |
| GET | `/admin/stats` | `DashboardController@stats` | Data statistik |
| PATCH | `/admin/users/{user}/toggle-status` | `DashboardController@toggleUserStatus` | Aktif/nonaktifkan user |
| PATCH | `/admin/users/{user}/role` | `DashboardController@updateUserRole` | Ubah role user |

#### Profile

| Method | URI | Controller | Deskripsi |
|---|---|---|---|
| GET | `/profile` | `ProfileController@edit` | Halaman edit profil |
| PATCH | `/profile` | `ProfileController@update` | Update profil |
| DELETE | `/profile` | `ProfileController@destroy` | Hapus akun |

#### Email Verification & Password

| Method | URI | Deskripsi |
|---|---|---|
| GET | `/verify-email` | Prompt verifikasi email |
| GET | `/verify-email/{id}/{hash}` | Verifikasi email (signed) |
| POST | `/email/verification-notification` | Kirim ulang notifikasi verifikasi |
| GET | `/confirm-password` | Konfirmasi password |
| POST | `/confirm-password` | Proses konfirmasi |
| PUT | `/password` | Update password |
| POST | `/logout` | Logout |

---

## 6. 💬 Fitur Chat

### Model Data Chat

- **Conversation**: Wadah percakapan (personal/group)
- **ConversationMember**: Anggota percakapan
- **Message**: Pesan individual (text/file)

### Fitur Chat

- **Pesan Teks** — Kirim dan terima pesan teks secara real-time
- **Upload File** — Kirim file (gambar, dokumen, dll) via drag & drop atau tombol upload
- **Read Receipt** — Tanda sudah dibaca (read_at)
- **Real-time** — Update pesan dan daftar percakapan secara real-time via WebSocket
- **Indicator Online** — Status online/last seen
- **File Preview** — Preview gambar dalam lightbox
- **Notification** — Notifikasi browser/PWA/Capacitor saat pesan baru

### Alur Kirim Pesan

```
User A → POST /chat/{conv}/send
    │
    ├── Simpan ke database (messages table)
    ├── Broadcast MessageSent → PrivateChannel('conversation.{id}')
    │   └── User B (di percakapan yang sama) menerima pesan real-time
    ├── Broadcast ConversationNewMessage → PrivateChannel('App.Models.User.{userId}')
    │   └── Semua anggota menerima update daftar percakapan
    └── Kirim notifikasi (jika user B tidak sedang di tab chat)
```

### Guest Chat Flow (Public)

```
User → GET /guest-chat (form)
    │
    ├── Isi: name (required), no_rm (optional), phone (optional)
    ├── Captcha: jawab soal matematika
    │
    ▼
POST /guest-chat → PublicGuestChatController@store
    │
    ├── Buat user guest baru (auto-generated username + password)
    ├── Auto-login via Auth::login()
    ├── Cari CS dengan beban percakapan paling sedikit
    ├── Buat conversation antara guest + CS
    ├── Kirim welcome message otomatis dari CS
    │
    ▼
Redirect → /chat/{conversation} (full chat interface real-time)
```

---

## 7. ⚡ Real-time Broadcasting (Reverb)

### Arsitektur WebSocket

```
Browser (WSS :443)
    → Cloudflare Tunnel
    → Apache (:80) mod_proxy_wstunnel
    → ProxyPass /app/ → Reverb (:8081)
```

### Events

#### `MessageSent` (`ShouldBroadcastNow`)
- **Channel:** `PrivateChannel('conversation.{conversation_id}')`
- **Broadcast Name:** `message.sent`
- **Tujuan:** Mengirim pesan ke semua anggota percakapan secara real-time
- **Data:** id, conversation_id, sender (id, name, username), tipe_pesan, isi_pesan, file info, read_at, created_at

#### `ConversationNewMessage` (`ShouldBroadcastNow`)
- **Channel:** `PrivateChannel('App.Models.User.{userId}')`
- **Broadcast Name:** `conversation.new.message`
- **Tujuan:** Update sidebar/daftar percakapan semua anggota
- **Data:** conversation_id, sender info, message preview, timestamp

### Frontend Listener (Laravel Echo)

```javascript
// Active conversation — pesan baru
Echo.private(`conversation.${conv.id}`)
    .listen('.message.sent', (e) => { ... });

// User channel — update daftar percakapan
Echo.private(`App.Models.User.${auth.user.id}`)
    .listen('.conversation.new.message', (e) => { ... });
```

### Konfigurasi Reverb (.env)

```env
REVERB_HOST=127.0.0.1
REVERB_PORT=8081
REVERB_SCHEME=http

VITE_REVERB_HOST=127.0.0.1
VITE_REVERB_PORT=443
```

Frontend auto-detects WSS vs WS via `window.location.protocol`.

### Systemd Service (Production)

```ini
[Unit]
Description=Laravel Reverb WebSocket Server (RSMP Chat)
After=network.target

[Service]
Type=simple
User=www
Group=www
WorkingDirectory=/www/wwwroot/chat.cloudnod.my.id
ExecStart=/usr/bin/php artisan reverb:start --port=8081 --host=0.0.0.0 --no-interaction
Restart=always
RestartSec=5
```

---

## 8. 🎨 Frontend (React + Inertia)

### Entry Points

- **`app.jsx`** — Bootstrap Inertia + Capacitor
- **`bootstrap.js`** — Axios + Laravel Echo dengan Reverb

### Layouts

| Layout | Deskripsi |
|---|---|
| `AuthenticatedLayout` | Navigasi utama, user menu, PWA components |
| `GuestLayout` | Layout sederhana untuk halaman publik |

### Komponen UI

| Komponen | Deskripsi |
|---|---|
| `ApplicationLogo` | SVG logo chat bubble |
| `Modal` | Dialog modal (Headless UI) |
| `Dropdown` | Dropdown menu (Trigger, Content, Link) |
| `TextInput`, `Checkbox` | Form controls |
| `PrimaryButton`, `SecondaryButton`, `DangerButton` | Tombol |
| `NavLink`, `ResponsiveNavLink` | Link navigasi |
| `PwaInstallButton` | Tombol instal PWA |
| `SwUpdateBanner` | Banner update service worker |

### Halaman

| Halaman | File | Deskripsi |
|---|---|---|
| **Welcome** | `Welcome.jsx` | Landing page dengan CTA login/guest chat |
| **Login** | `Auth/Login.jsx` | Dual-tab login (Pasien/Petugas) dengan tema WhatsApp |
| **Dashboard** | `Dashboard.jsx` | Admin dashboard dengan 3 tab (Ringkasan, Pengguna, Intip Chat) + recharts |
| **Chat Main** | `Chat/Main.jsx` | WhatsApp-style UI: sidebar + chat view, real-time, upload file |
| **Chat Index** | `Chat/Index.jsx` | Daftar percakapan dengan modal create |
| **Chat Show** | `Chat/Show.jsx` | View percakapan tunggal |
| **Guest Start** | `Guest/StartChat.jsx` | Form inisiasi guest (auth) |
| **Public Chat** | `Guest/PublicChat.jsx` | Form publik dengan captcha + animated hero |
| **Profile** | `Profile/Edit.jsx` | Edit profil dengan partials |

### Dependencies Frontend

| Package | Versi | Kegunaan |
|---|---|---|
| `react`, `react-dom` | ^18.2.0 | UI framework |
| `@inertiajs/react` | ^2.0.0 | Inertia.js React adapter |
| `@headlessui/react` | ^2.0.0 | UI primitives (modal, dll) |
| `tailwindcss` | ^3.2.1 | CSS utility framework |
| `recharts` | ^3.9.1 | Charting untuk dashboard |
| `laravel-echo` | ^2.3.7 | WebSocket client |
| `pusher-js` | ^8.5.0 | Pusher protocol client |
| `@capacitor/*` | ^8.4.1 | Capacitor native integration |

---

## 9. 📱 PWA & Mobile

### PWA Configuration

- **manifest.json** — `backend/public/manifest.json`
  - Name: "APP Chat Internal RSMP Patrol"
  - Icons: Semua ukuran (72, 96, 128, 144, 152, 192, 384, 512 + maskable)
  - Display: `standalone`
  - Theme: `#075E54` (WhatsApp green)

- **Service Worker** — `backend/public/sw.js`
  - Cache-first: assets, fonts, images
  - Network-first: navigasi
  - Stale-while-revalidate: others
  - Offline HTML fallback
  - Push notifications dengan actions

- **PWA Components:**
  - `PwaInstallButton.jsx` — Floating install button
  - `SwUpdateBanner.jsx` — Update notification banner

### PWA Meta Tags (app.blade.php)

- iOS splash screen
- Mask icon
- Multiple icon sizes
- Service worker registration dengan update detection

---

## 10. 🖥️ Desktop App (Electron)

### Lokasi: `desktop/`

### Stack

- **Runtime:** Electron
- **Packaging:** electron-builder (NSIS installer)
- **Config:** Loads from `http://chat.test` (dev) / `https://chat.cloudnod.my.id` (prod)

### Fitur

- System tray (minimize to tray)
- Native notifications
- Custom app menu (Bahasa Indonesia)
- App info dialog

### Scripts

| Command | Deskripsi |
|---|---|
| `npm start` | Jalankan app |
| `npm run dev` | Jalankan dengan DevTools |
| `npm run build` | Build NSIS installer (x64) |

### Debug

- **Log:** `desktop/electron-log.txt`
- **Error:** `desktop/electron-err.txt`

### Build Output

- **Installer:** `desktop/dist/RSMP-Chat-Setup-1.0.0.exe`
- **Deploy:** `backend/public/RSMP-Chat-Setup-1.0.0.exe`

---

## 11. 🤖 Android APK (Capacitor)

### Lokasi: `backend/android/`

### Stack

- **Framework:** Capacitor Android 8.x
- **Config:** `backend/capacitor.config.json`
- **Server URL:** `https://chat.cloudnod.my.id`

### Fitur Native

- **Status Bar:** Solid `#075E54` (tidak translucent)
- **Local Notifications:** Via `@capacitor/local-notifications`
- **Safe Area:** CSS `env(safe-area-inset-top)` untuk header

### Build Steps

```powershell
# 1. Build frontend
cd backend
npm run build

# 2. Copy assets ke Android
Copy-Item -Recurse -Force public\build android\app\src\main\assets\public\

# 3. Set environment
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot'
$env:ANDROID_HOME='C:\Users\RSMPPIT\AppData\Local\Android\Sdk'

# 4. Build APK
cd android
.\gradlew.bat assembleRelease --no-daemon
```

### Output

- **APK:** `C:\temp\android-build-rsmp\outputs\apk\release\app-release.apk`
- **Copy:** `backend/android/app-release.apk`
- **Deploy:** `/www/wwwroot/chat.cloudnod.my.id/public/app-release.apk`

### Release Signing

- **Keystore:** `release.keystore` (alias: `rsmp-chat`, password: `rsmp12345`)
- **Config:** `keystore.properties`
- **Validity:** 10,000 days

---

## 12. 🌍 Deployment & Infrastruktur

### Server Production

| Item | Detail |
|---|---|
| **Domain** | `chat.cloudnod.my.id` |
| **Server IP** | `192.168.0.27` |
| **SSH User** | `sentral` |
| **Path** | `/www/wwwroot/chat.cloudnod.my.id` |
| **Web Server** | Apache (aaPanel) — port 80 |
| **PHP** | 8.3.30 (PHP-FPM via socket) |
| **Database** | MySQL, user `chat`, password `warofdemon3` |
| **Tunnel** | Cloudflare Tunnel (cloudflared) — systemd service |

### Deployment Steps

```bash
# 1. Zip dan upload backend/
# 2. Backup existing
sudo mv /www/wwwroot/chat.cloudnod.my.id /www/wwwroot/chat.cloudnod.my.id.bak.$(date +%Y%m%d_%H%M%S)

# 3. Extract
sudo unzip -o /tmp/chat-backend.zip -d /www/wwwroot/chat.cloudnod.my.id/

# 4. Restore .env dari backup
sudo cp /www/wwwroot/chat.cloudnod.my.id.bak.*/.env /www/wwwroot/chat.cloudnod.my.id/.env

# 5. Install dependencies & migrate
sudo -u www composer install --no-dev --ignore-platform-req=ext-fileinfo
sudo -u www php artisan migrate --force

# 6. Cache
sudo -u www php artisan config:clear
sudo -u www php artisan config:cache
sudo -u www php artisan route:cache
sudo -u www php artisan view:cache
```

### WebSocket Architecture (Production)

```
Browser (WSS :443)
    → Cloudflare
    → Cloudflare Tunnel
    → Apache (:80)
    → mod_proxy_wstunnel (ProxyPass /app/ → localhost:8081)
    → Laravel Reverb (:8081)
```

### Konfigurasi Apache Proxy WS

```apache
# File: /www/server/panel/vhost/apache/extension/chat.cloudnod.my.id/proxy_ws.conf
ProxyPass /app/ ws://127.0.0.1:8081/app/
```

### Environment Production (.env)

```env
APP_NAME="APP Chat Internal RSMP Patrol"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://chat.cloudnod.my.id
ASSET_URL=https://chat.cloudnod.my.id

DB_DATABASE=chat
DB_USERNAME=chat
DB_PASSWORD=warofdemon3

REVERB_HOST=127.0.0.1
REVERB_PORT=8081
REVERB_SCHEME=http

VITE_REVERB_HOST=127.0.0.1
VITE_REVERB_PORT=443

LOG_LEVEL=warning
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
```

### Catatan Penting

- **ext-fileinfo** tidak tersedia di server → upload file pakai `$file->move()` bukan `Storage::put()`
- **Config cache** — Selalu `config:clear` dulu sebelum `config:cache`
- **Trust Proxies** — `$middleware->trustProxies(at: '*')` untuk HTTPS di belakang Cloudflare
- **Reverb** — Auto-start via systemd service `reverb.service`
- **Port 8080** dipakai Docker (Stirling-PDF), Reverb pakai port 8081

---

## 13. 🔧 Developer Guide

### Setup Lokal

```bash
# Prasyarat
- PHP 8.3+
- Composer
- Node.js 18+
- MySQL
- Laragon (recommended)

# Clone & Install
cd backend
composer install
npm install

# Environment
cp .env.example .env
# Edit .env: DB_DATABASE=chat, DB_USERNAME=root, DB_PASSWORD=

# Generate key & migrate
php artisan key:generate
php artisan migrate

# Seed database
php artisan db:seed

# Build frontend
npm run build

# Atau dev mode
npm run dev  # Terminal 1
php artisan serve  # Terminal 2
php artisan reverb:start --port=8080  # Terminal 3

# Queue worker (untuk broadcast)
php artisan queue:work
```

### Command Penting

| Command | Deskripsi |
|---|---|
| `php artisan migrate` | Jalankan migrasi |
| `php artisan migrate:fresh` | Reset database |
| `php artisan db:seed` | Seed data awal |
| `php artisan reverb:start` | Start WebSocket server |
| `php artisan queue:work` | Process queue jobs |
| `npm run dev` | Vite dev server |
| `npm run build` | Build production frontend |
| `php artisan config:cache` | Cache config |
| `php artisan route:cache` | Cache routes |
| `php artisan view:cache` | Cache views |

### User Testing

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Admin |
| `cs1` | `password123` | Customer Service |
| `cs2` | `password123` | Customer Service |
| `internal1` | `password123` | User Internal |
| `internal2` | `password123` | User Internal |
| `user1` | `password123` | User / Pasien |
| `user2` | `password123` | User / Pasien |
| `guest1` | `password123` | Guest (RM: RM-2026-0001) |
| `guest2` | `password123` | Guest (RM: RM-2026-0002) |

### Troubleshooting

#### WebSocket Tidak Terhubung
1. Pastikan Reverb running: `php artisan reverb:status`
2. Cek port: `netstat -an | findstr :8081`
3. Cek Apache proxy: ProxyPass `/app/` harus aktif
4. Cek browser console untuk error koneksi

#### Upload File Error (Production)
- Server tidak punya ext-fileinfo → file upload via `$file->move()` saja
- Validasi pakai `getClientOriginalExtension()` bukan `mimes:`
- Cek folder `storage/app/public/` writable

#### Config Cache Error
- Selalu jalankan `php artisan config:clear` SEBELUM `php artisan config:cache`
- Jika APP_KEY berubah, clear cache dulu

#### Login Tidak Bisa (Pasien)
- Pastikan menggunakan No. RM bukan username
- Captcha harus diisi dengan benar
- Cek session driver: harus database

---

## Appendix

### A. File Penting

| File | Lokasi | Fungsi |
|---|---|---|
| `.env` | `backend/.env` | Environment config |
| `manifest.json` | `backend/public/manifest.json` | PWA manifest |
| `sw.js` | `backend/public/sw.js` | Service worker |
| `capacitor.config.json` | `backend/capacitor.config.json` | Capacitor config |
| `vite.config.js` | `backend/vite.config.js` | Vite build config |
| `reverb-watch.ps1` | `backend/reverb-watch.ps1` | Reverb auto-restart script |

### B. External Services

| Service | Kegunaan |
|---|---|
| **Cloudflare** | CDN, SSL, DDoS protection, Tunnel |
| **Laravel Reverb** | WebSocket server real-time |
| **Pusher Protocol** | WebSocket protocol (via Reverb) |
| **WhatsApp Business API** | Notifikasi & integrasi WhatsApp (future) |
| **Capacitor** | Android native wrapper |

### C. Environment Variables (.env)

```env
APP_NAME="APP Chat Internal RSMP Patrol"
APP_ENV=local                    # local / production
APP_DEBUG=true                   # true / false
APP_URL=http://chat.test         # Base URL
ASSET_URL=                       # Asset URL (untuk production)

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=chat
DB_USERNAME=root
DB_PASSWORD=

BROADCAST_CONNECTION=reverb
QUEUE_CONNECTION=database
CACHE_STORE=database
SESSION_DRIVER=database

REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
REVERB_APP_ID=chat-app
REVERB_APP_KEY=chat-app-key
REVERB_APP_SECRET=chat-app-secret

VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

---

> **Dokumentasi ini dibuat pada 2026-07-08.**  
> Untuk update atau koreksi, silakan update file `DOCUMENTATION.md` di root project.
