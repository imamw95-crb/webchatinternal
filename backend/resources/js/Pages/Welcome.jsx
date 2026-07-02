import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }) {
    return (
        <div className="relative min-h-screen min-h-screen-fix overflow-hidden bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#25D366]">
            <Head title="Selamat Datang" />
            <style>{`@supports (height: 100dvh) { .min-h-screen-fix { min-height: 100dvh; } }`}</style>

            {/* Decorative background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl"></div>
                <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/5 blur-3xl"></div>
                <div className="absolute left-1/4 top-1/3 h-48 w-48 rounded-full bg-white/[0.03] blur-2xl"></div>
                <div className="absolute right-1/4 bottom-1/4 h-32 w-32 rounded-full bg-white/[0.03] blur-2xl"></div>

                {/* Floating icons */}
                <div className="absolute left-[10%] top-[20%] animate-bounce opacity-10">
                    <svg className="h-16 w-16 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                    </svg>
                </div>
                <div className="absolute right-[15%] top-[30%] animate-pulse opacity-10">
                    <svg className="h-20 w-20 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
                {/* Logo */}
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-lg">
                    <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                    </svg>
                </div>

                {/* Title */}
                <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    APP Chat Internal
                </h1>
                <p className="mb-2 text-center text-2xl font-semibold text-white/90">
                    RSMP Patrol
                </p>

                <div className="my-6 h-px w-24 bg-white/20"></div>

                <p className="mb-10 max-w-sm text-center text-base text-white/70">
                    Aplikasi komunikasi internal untuk tim RSMP Patrol. 
                    Chat real-time, kirim file, dan tetap terhubung dimanapun.
                </p>

                {/* CTA Buttons */}
                {!auth.user ? (
                    <div className="flex flex-col items-center gap-3 sm:flex-row">
                        <Link
                            href={route('login')}
                            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-white px-8 py-3.5 text-base font-semibold text-[#075E54] shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 00-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                            </svg>
                            Masuk ke Aplikasi
                        </Link>
                        <Link
                            href={route('public.guest.chat.create')}
                            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border-2 border-white/30 bg-white/10 px-8 py-3.5 text-base font-semibold text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:shadow-xl hover:scale-105 active:scale-95"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                            </svg>
                            Chat Customer Service
                        </Link>
                    </div>
                ) : (
                    <Link
                        href={route('chat.main')}
                        className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-white px-8 py-3.5 text-base font-semibold text-[#075E54] shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                        </svg>
                        Buka Chat
                    </Link>
                )}

                {/* Footer */}
                <p className="mt-16 text-center text-sm text-white/40">
                    &copy; {new Date().getFullYear()} RSMP Patrol. All rights reserved.
                </p>
            </div>
        </div>
    );
}
