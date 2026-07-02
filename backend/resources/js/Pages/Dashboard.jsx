import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Link
                            href={route('chat.main')}
                            className="overflow-hidden rounded-lg bg-white shadow-sm transition hover:shadow-md"
                        >
                            <div className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-2xl">
                                        💬
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Chat
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Mulai atau lanjutkan percakapan
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link
                            href={route('profile.edit')}
                            className="overflow-hidden rounded-lg bg-white shadow-sm transition hover:shadow-md"
                        >
                            <div className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
                                        👤
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Profil
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Kelola informasi akun
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
