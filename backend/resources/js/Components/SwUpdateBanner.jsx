import { useState, useEffect } from 'react';

export default function SwUpdateBanner() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [registration, setRegistration] = useState(null);

    useEffect(() => {
        const handleUpdate = (e) => {
            setUpdateAvailable(true);
            setRegistration(e.detail.registration);
        };

        window.addEventListener('sw-update', handleUpdate);
        return () => window.removeEventListener('sw-update', handleUpdate);
    }, []);

    const handleUpdate = () => {
        if (registration?.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        window.location.reload();
    };

    if (!updateAvailable) return null;

    return (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 transform">
            <div className="flex items-center gap-3 rounded-xl bg-indigo-600 px-6 py-3 text-sm text-white shadow-xl">
                <span>🚀 Pembaruan tersedia!</span>
                <button
                    onClick={handleUpdate}
                    className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                >
                    Perbarui
                </button>
                <button
                    onClick={() => setUpdateAvailable(false)}
                    className="text-white/70 hover:text-white"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
