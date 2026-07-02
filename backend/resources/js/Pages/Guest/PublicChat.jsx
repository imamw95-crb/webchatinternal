import { Head, useForm, usePage } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

export default function PublicChat() {
    const { captcha } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        no_rm: '',
        phone: '',
        captcha_answer: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('public.guest.chat.store'));
    };

    return (
        <>
            <Head title="Chat Customer Service" />

            <div className="flex min-h-screen min-h-screen-fix flex-col bg-gray-100">
                <style>{`
                    @supports (height: 100dvh) { .min-h-screen-fix { min-height: 100dvh; } }
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-10px); }
                    }
                    .animate-float { animation: float 3s ease-in-out infinite; }
                    @keyframes pulse-dot {
                        0%, 100% { opacity: 0.4; transform: scale(1); }
                        50% { opacity: 1; transform: scale(1.2); }
                    }
                    .pulse-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
                    .pulse-dot:nth-child(2) { animation-delay: 0.3s; }
                    .pulse-dot:nth-child(3) { animation-delay: 0.6s; }
                `}</style>

                {/* Hero Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#25D366] px-4 pb-16 pt-10 text-white">
                    {/* Decorative Elements */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-2xl"></div>
                        <div className="absolute -bottom-10 -right-10 h-60 w-60 rounded-full bg-white/5 blur-3xl"></div>
                        <div className="absolute left-1/3 top-1/4 h-24 w-24 rounded-full bg-white/[0.03] blur-xl"></div>
                    </div>

                    {/* Chat Bubble Decoration */}
                    <div className="absolute right-6 top-8 opacity-10">
                        <svg className="h-20 w-20 text-white animate-float" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                        </svg>
                    </div>

                    <div className="relative z-10 mx-auto max-w-lg text-center">
                        {/* Logo */}
                        <div className="mb-6 flex justify-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-lg">
                                <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                                </svg>
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Chat Customer Service
                        </h1>
                        <p className="mt-2 text-sm text-white/80 sm:text-base">
                            RSMP Patrol — Siap membantu Anda dengan cepat dan ramah
                        </p>

                        {/* Online indicator */}
                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/70">
                            <span className="flex gap-0.5">
                                <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-green-300"></span>
                                <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-green-300"></span>
                                <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-green-300"></span>
                            </span>
                            <span>Tim Customer Service Online</span>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div className="px-4 pb-8 sm:px-6">
                    <div className="mx-auto max-w-md">
                        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
                            {/* Form Header */}
                            <div className="border-b border-gray-100 px-6 py-5">
                                <h2 className="text-center text-base font-semibold text-gray-800">
                                    Isi data diri Anda
                                </h2>
                                <p className="mt-1.5 text-center text-xs text-gray-400">
                                    Untuk memulai percakapan dengan customer service kami
                                </p>
                            </div>

                            <form onSubmit={submit} className="space-y-5 px-6 py-6">
                                {/* Name */}
                                <div>
                                    <InputLabel htmlFor="name" value="Nama Lengkap" />
                                    <TextInput
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        className="mt-1 block w-full"
                                        placeholder="Masukkan nama lengkap Anda"
                                        autoComplete="name"
                                        isFocused={true}
                                        onChange={(e) => setData('name', e.target.value)}
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                {/* No RM */}
                                <div>
                                    <InputLabel htmlFor="no_rm" value="Nomor Rekam Medis (RM)" />
                                    <TextInput
                                        id="no_rm"
                                        type="text"
                                        name="no_rm"
                                        value={data.no_rm}
                                        className="mt-1 block w-full"
                                        placeholder="Masukkan nomor rekam medis (jika ada)"
                                        onChange={(e) => setData('no_rm', e.target.value)}
                                    />
                                    <p className="mt-1 text-xs text-gray-400">Opsional — untuk pasien yang sudah terdaftar</p>
                                    <InputError message={errors.no_rm} className="mt-2" />
                                </div>

                                {/* Phone */}
                                <div>
                                    <InputLabel htmlFor="phone" value="Nomor Telepon" />
                                    <TextInput
                                        id="phone"
                                        type="tel"
                                        name="phone"
                                        value={data.phone}
                                        className="mt-1 block w-full"
                                        placeholder="Masukkan nomor telepon (opsional)"
                                        onChange={(e) => setData('phone', e.target.value)}
                                    />
                                    <p className="mt-1 text-xs text-gray-400">Opsional — untuk menghubungi kembali jika perlu</p>
                                    <InputError message={errors.phone} className="mt-2" />
                                </div>

                                {/* Captcha */}
                                <div>
                                    <InputLabel htmlFor="captcha_answer" value="Verifikasi Keamanan" />
                                    <div className="mt-1 flex items-center gap-3">
                                        <div className="flex h-12 w-24 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold text-gray-700 select-none">
                                            {captcha?.num1 ?? '?'} + {captcha?.num2 ?? '?'}
                                        </div>
                                        <TextInput
                                            id="captcha_answer"
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

                                {/* Error message */}
                                {errors.message && (
                                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                                        {errors.message}
                                    </div>
                                )}

                                {/* Submit */}
                                <PrimaryButton
                                    type="submit"
                                    className="w-full justify-center bg-[#075E54] hover:bg-[#054d44] active:bg-[#043d36] transition-all duration-200"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                            </svg>
                                            Memproses...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                                            </svg>
                                            Mulai Chat
                                        </span>
                                    )}
                                </PrimaryButton>
                            </form>
                        </div>

                        {/* Info Cards */}
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-lg bg-white p-3 shadow-sm">
                                <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-[#D9FDD3]">
                                    <svg className="h-4 w-4 text-[#075E54]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                </div>
                                <p className="text-xs font-medium text-gray-700">Respon Cepat</p>
                                <p className="mt-0.5 text-xs text-gray-400">Dibalas dalam hitungan menit</p>
                            </div>
                            <div className="rounded-lg bg-white p-3 shadow-sm">
                                <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-[#D9FDD3]">
                                    <svg className="h-4 w-4 text-[#075E54]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                                    </svg>
                                </div>
                                <p className="text-xs font-medium text-gray-700">Aman & Rahasia</p>
                                <p className="mt-0.5 text-xs text-gray-400">Data Anda terjaga kerahasiaannya</p>
                            </div>
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
