# Frontend: React 18 + Inertia + Tailwind

**Entry:** `resources/views/app.blade.php` → `resources/js/app.jsx` → `app.css` + `bootstrap.js`

**Pages** (`resources/js/Pages/`):
- `Auth/` — Login, Register, ForgotPassword, ResetPassword, VerifyEmail, ConfirmPassword
- `Chat/Main.jsx` — main interface (sidebar+chat area, real-time, file upload, infinite scroll)
- `Chat/Index.jsx` — conversation list
- `Chat/Show.jsx` — single conversation
- `Welcome.jsx` — landing page
- `Dashboard.jsx` — dashboard
- `Profile/Edit.jsx` — profile editing

**Components:** ApplicationLogo, Checkbox, TextInput, PrimaryButton, SecondaryButton, DangerButton, InputError, InputLabel, Dropdown, Modal, NavLink, ResponsiveNavLink

**Layouts:** AuthenticatedLayout (nav+dropdown), GuestLayout (centered card)

**Tailwind:** custom `wa-*` palette (teal/green/gray), WhatsApp theme, iOS Safari fixes

**Build:** `npm run dev` (HMR) | `npm run build` from `backend/`

**Key deps:** react 18, @inertiajs/react 2, tailwindcss 3, laravel-echo 2, pusher-js 8, @headlessui/react 2
