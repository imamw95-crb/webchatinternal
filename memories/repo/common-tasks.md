# Commands — run ALL from `backend/`

**Serve:** `php artisan serve` | `php artisan reverb:start` | `php artisan queue:work`
**Build:** `npm run dev` (HMR) | `npm run build` | `npm install`

**DB:** `php artisan migrate` | `migrate:fresh --seed` | `db:seed` | `make:migration`
**Clear:** `php artisan cache:clear` | `config:clear` | `route:clear` | `view:clear` | `optimize:clear`
**Make:** `make:model` | `make:controller` | `make:event` | `make:middleware` | `make:request`
**Storage:** `php artisan storage:link`

**Full dev:** T1: `php artisan serve` | T2: `php artisan reverb:start` | T3: `php artisan queue:work` | T4: `npm run dev`

**Env:** `backend/.env` — APP_NAME="APP Chat Internal RSMP Patrol", APP_ENV=local, APP_DEBUG=true
**DB:** MySQL `chat`@127.0.0.1 root/no pw
**Seed:** admin/admin123(admin), user1/password123(user), user2/password123(user)
