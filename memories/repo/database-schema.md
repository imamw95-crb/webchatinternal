# Database: MySQL `chat`@127.0.0.1 root/no pw

**Seed users:** admin/admin123(admin), user1/password123(user), user2/password123(user)

**Tables:**

users — id(PK), name, username(UNIQUE→login), nik(UNIQUE), email(UNIQUE), email_verified_at, password(hashed), remember_token, role(default:'user'), status_aktif(bool), last_seen_at, timestamps

conversations — id(PK), tipe(enum:personal|grup), nama_grup(nullable), timestamps

conversation_members — id(PK), conversation_id(FK→conversations CASCADE), user_id(FK→users CASCADE), joined_at, timestamps. UNIQUE(conversation_id,user_id)

messages — id(PK), conversation_id(FK CASCADE), sender_id(FK→users CASCADE), tipe_pesan(enum:text|file), isi_pesan(text), file_path, file_type, file_name, file_size(bigint), read_at(timestamp), timestamps. INDEX(conversation_id,created_at)

sessions, cache, cache_locks, jobs, job_batches, failed_jobs — Laravel standard

**Relations:** User ↔ Conversation (via conversation_members), User ─< messages, Conversation ─< messages
