# App Logic

**Auth:** Login via `username` (not email). Rate limit 5/min. Guard=web(session). Sanctum HasApiTokens.

**ChatController:**
- `getConversationsList()` — user's convos + last message + unread count (`read_at IS NULL`), sorted by newest activity
- `sendMessage()` — validate member, text OR file(max 20MB), store to `uploads/Y/m/d/{userId}/`, create Message, broadcast MessageSent->toOthers()
- `createConversation()` — personal or grup, auto-add auth user, prevent duplicate personal(2 people), redirect
- `destroy()` — personal(2): detach only | grup: delete all messages+members+conversation
- `markAsRead()` — set `read_at` on unread messages not by current user
- `messages()` — paginated 50, supports `?before={messageId}` for infinite scroll

**Middleware (web):** HandleInertiaRequests → AddLinkHeadersForPreloadedAssets → UpdateLastSeen

**CSRF例外:** `chat/*/send` (for file upload multipart)
**Error:** JSON only for `api/*` routes; 403 if non-member accesses conversation
