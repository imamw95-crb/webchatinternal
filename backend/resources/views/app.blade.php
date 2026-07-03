<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- PWA -->
        <link rel="manifest" href="/manifest.json">
        <meta name="theme-color" content="#4f46e5">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="RSMP Chat">
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
        <link rel="mask-icon" href="/icons/icon.svg" color="#4f46e5">
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg">
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png">
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png">

        <!-- iOS Splash -->
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" media="(device-width: 375px)">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead

        <!-- Service Worker Registration -->
        <script>
            if ('serviceWorker' in navigator) {
                let swReady = false;

                navigator.serviceWorker.register('/sw.js').then((reg) => {
                    swReady = true;
                    console.log('[PWA] SW registered:', reg.scope);

                    // Check for updates
                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New version available
                                const event = new CustomEvent('sw-update', { detail: { registration: reg } });
                                window.dispatchEvent(event);
                            }
                        });
                    });
                }).catch((err) => {
                    console.warn('[PWA] SW registration failed:', err);
                });

                // Re-register if controller changes
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    window.location.reload();
                });
            }

            // --- Before Install Prompt ---
            let deferredPrompt = null;
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                const event = new CustomEvent('pwa-install-ready', { detail: { prompt: deferredPrompt } });
                window.dispatchEvent(event);
            });

            window.addEventListener('appinstalled', () => {
                console.log('[PWA] App installed');
                deferredPrompt = null;
            });
        </script>
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
