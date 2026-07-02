# Routes

**CSRF例外:** `chat/*/send` (bootstrap/app.php)
**Auth guardian:** web (session), login via username

**Web (auth required):**
- GET `/dashboard` → dashboard
- GET `/chat/{conversation?}` → chat.main (ChatController@main)
- GET `/chat/{conversation}/messages` → chat.messages (JSON, ?before=id)
- POST `/chat/{conversation}/send` → chat.send (text/file multipart)
- POST `/chat/{conversation}/read` → chat.read (mark read)
- POST `/chat/create` → chat.create (personal|grup)
- DELETE `/chat/{conversation}` → chat.destroy
- GET `/users` → users.list
- GET/PATCH/DELETE `/profile` → profile.edit/update/destroy

**Auth routes** (Breeze): login, register, logout, password reset, email verify, password confirm (throttled 5/min)

**Broadcast channels:** `App.Models.User.{id}` (self), `conversation.{id}` (must be member)
**Auth endpoint:** `/broadcasting/auth`

**Inertia shared:** `auth.user` (HandleInertiaRequests middleware)
