import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Login({ status }) {
    const { captcha } = usePage().props;
    const [loginType, setLoginType] = useState('pasien'); // 'pasien' | 'petugas'

    const { data, setData, post, processing, errors, reset } = useForm({
        login_type: 'pasien',
        no_rm: '',
        username: '',
        password: '',
        remember: false,
        captcha_answer: '',
    });

    const switchTab = (type) => {
        setLoginType(type);
        setData('login_type', type);
        // Reset errors when switching
        if (errors) {
            reset('password');
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Masuk" />

            <div className="flex min-h-screen min-h-screen-fix flex-col bg-gray-100">
                <style>{`
                    @supports (height: 100dvh) { .min-h-screen-fix { min-height: 100dvh; } }
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-10px); }
                    }
                    .animate-float { animation: float 3s ease-in-out infinite; }
                `}</style>

                {/* Hero Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#25D366] px-4 pb-16 pt-10 text-white">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-2xl"></div>
                        <div className="absolute -bottom-10 -right-10 h-60 w-60 rounded-full bg-white/5 blur-3xl"></div>
                        <div className="absolute left-1/3 top-1/4 h-24 w-24 rounded-full bg-white/[0.03] blur-xl"></div>
                    </div>

                    <div className="absolute right-6 top-8 opacity-10">
                        <svg className="h-20 w-20 text-white animate-float" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                        </svg>
                    </div>

                    <div className="relative z-10 mx-auto max-w-lg text-center">
                        <div className="mb-5 flex justify-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-lg">
                                <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                                </svg>
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Masuk ke Aplikasi
                        </h1>
                        <p className="mt-2 text-sm text-white/80 sm:text-base">
                            RSMP Patrol — Silakan pilih metode login Anda
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="px-4 pb-8 sm:px-6">
                    <div className="mx-auto max-w-md">
                        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
                            {/* Tab Switcher */}
                            <div className="flex border-b border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => switchTab('pasien')}
                                    className={`flex-1 py-3.5 text-sm font-medium transition-all duration-200 relative ${
                                        loginType === 'pasien'
                                            ? 'text-[#075E54]'
                                            : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    <span className="flex items-center justify-center gap-1.5">
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                        </svg>
                                        Pasien / Guest
                                    </span>
                                    {loginType === 'pasien' && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#075E54]"></span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => switchTab('petugas')}
                                    className={`flex-1 py-3.5 text-sm font-medium transition-all duration-200 relative ${
                                        loginType === 'petugas'
                                            ? 'text-[#075E54]'
                                            : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    <span className="flex items-center justify-center gap-1.5">
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                        </svg>
                                        Petugas
                                    </span>
                                    {loginType === 'petugas' && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#075E54]"></span>
                                    )}
                                </button>
                            </div>

                            {status && (
                                <div className="mx-6 mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 border border-green-200">
                                    {status}
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-5 px-6 py-6">
                                {/* ===== PASIENT / GUEST LOGIN ===== */}
                                {loginType === 'pasien' && (
                                    <>
                                        <div>
                                            <InputLabel htmlFor="no_rm" value="Nomor Rekam Medis (RM)" />
                                            <TextInput
                                                id="no_rm"
                                                type="text"
                                                name="no_rm"
                                                value={data.no_rm}
                                                className="mt-1 block w-full"
                                                placeholder="Masukkan No. RM Anda"
                                                autoComplete="off"
                                                isFocused={true}
                                                onChange={(e) => setData('no_rm', e.target.value)}
                                            />
                                            <InputError message={errors.no_rm} className="mt-2" />
                                            <p className="mt-1.5 text-xs text-gray-400">
                                                Masukkan No. Rekam Medis untuk masuk tanpa password
                                            </p>
                                        </div>

                                        {/* Captcha */}
                                        <div>
                                            <InputLabel htmlFor="login_captcha_answer" value="Verifikasi Keamanan" />
                                            <div className="mt-1 flex items-center gap-3">
                                                <div className="flex h-12 w-24 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold text-gray-700 select-none">
                                                    {captcha?.num1 ?? '?'} + {captcha?.num2 ?? '?'}
                                                </div>
                                                <TextInput
                                                    id="login_captcha_answer"
                                                    type="number"
                                                    name="captcha_answer"
                                                    value={data.captcha_answer}
                                                    className="mt-0 block w-full"
                                                    placeholder="Jawaban"
                                                    onChange={(e) => setData('captcha_answer', e.target.value)}
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-gray-400">Masukkan hasil penjumlahan di atas</p>
                                            <InputError message={errors.captcha_answer} className="mt-2" />
                                        </div>

                                        <PrimaryButton
                                            type="submit"
                                            className="w-full justify-center bg-[#075E54] hover:bg-[#054d44] active:bg-[#043d36] transition-all duration-200"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                                    </svg>
                                                    Memproses...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 00-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                                                    </svg>
                                                    Masuk sebagai Pasien
                                                </span>
                                            )}
                                        </PrimaryButton>

                                        <div className="text-center">
                                            <Link
                                                href={route('public.guest.chat.create')}
                                                className="inline-flex items-center gap-1.5 text-sm text-[#075E54] hover:text-[#054d44] hover:underline transition-colors"
                                            >
                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                                                </svg>
                                                Baru? Chat Customer Service tanpa login
                                            </Link>
                                        </div>
                                    </>
                                )}

                                {/* ===== PETUGAS LOGIN ===== */}
                                {loginType === 'petugas' && (
                                    <>
                                        <div>
                                            <InputLabel htmlFor="username" value="Username" />
                                            <TextInput
                                                id="username"
                                                type="text"
                                                name="username"
                                                value={data.username}
                                                className="mt-1 block w-full"
                                                placeholder="Masukkan username"
                                                autoComplete="username"
                                                isFocused={true}
                                                onChange={(e) => setData('username', e.target.value)}
                                            />
                                            <InputError message={errors.username} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="password" value="Password" />
                                            <TextInput
                                                id="password"
                                                type="password"
                                                name="password"
                                                value={data.password}
                                                className="mt-1 block w-full"
                                                placeholder="Masukkan password"
                                                autoComplete="current-password"
                                                onChange={(e) => setData('password', e.target.value)}
                                            />
                                            <InputError message={errors.password} className="mt-2" />
                                        </div>

                                        <div className="flex items-center">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="remember"
                                                    checked={data.remember}
                                                    onChange={(e) => setData('remember', e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-300 text-[#075E54] focus:ring-[#075E54]"
                                                />
                                                <span className="text-sm text-gray-600 select-none">
                                                    Ingat saya
                                                </span>
                                            </label>
                                        </div>

                                        <PrimaryButton
                                            type="submit"
                                            className="w-full justify-center bg-[#075E54] hover:bg-[#054d44] active:bg-[#043d36] transition-all duration-200"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                                    </svg>
                                                    Memproses...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 00-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                                                    </svg>
                                                    Masuk sebagai Petugas
                                                </span>
                                            )}
                                        </PrimaryButton>
                                    </>
                                )}

                            </form>
                        </div>

                        {/* Back to Home */}
                        <div className="mt-4 text-center">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                                </svg>
                                Kembali ke Beranda
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto bg-white px-4 py-3 text-center text-xs text-gray-400 border-t border-gray-200">
                    &copy; {new Date().getFullYear()} RSMP Patrol. All rights reserved.
                </div>
            </div>
        </>
    );
}
