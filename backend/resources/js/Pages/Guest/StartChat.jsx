import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function StartChat() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        no_rm: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('guest.chat.initiate'));
    };

    return (
        <>
            <Head title="Mulai Konsultasi" />

            <div className="flex min-h-screen min-h-screen-fix flex-col bg-gray-100">
                {/* Header */}
                <div className="flex items-center justify-center bg-[#075E54] px-4 py-6 text-white">
                    <div className="text-center">
                        <div className="flex justify-center mb-3">
                            <ApplicationLogo className="h-16 w-16 fill-current text-white" />
                        </div>
                        <h1 className="text-xl font-bold">Chat Customer Service</h1>
                        <p className="mt-1 text-sm text-white/80">
                            Silakan isi data diri Anda untuk memulai konsultasi
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="flex-1 px-4 py-6 sm:px-6">
                    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
                        <form onSubmit={submit} className="space-y-5">
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
                                    placeholder="Masukkan nomor rekam medis"
                                    onChange={(e) => setData('no_rm', e.target.value)}
                                />
                                <InputError message={errors.no_rm} className="mt-2" />
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
                                className="w-full justify-center bg-[#075E54] hover:bg-[#054d44]"
                                disabled={processing}
                            >
                                {processing ? 'Memproses...' : 'Mulai Chat'}
                            </PrimaryButton>
                        </form>

                        <div className="mt-6 text-center text-xs text-gray-400">
                            Dengan melanjutkan, Anda menyetujui ketentuan layanan yang berlaku.
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-white px-4 py-3 text-center text-xs text-gray-400 border-t border-gray-200">
                    &copy; {new Date().getFullYear()} RSMP Patrol. All rights reserved.
                </div>
            </div>
        </>
    );
}
