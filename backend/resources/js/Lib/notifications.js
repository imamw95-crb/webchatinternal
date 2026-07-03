/**
 * Notifikasi helper — pakai Capacitor Local Notifications di native Android,
 * fallback ke Web Notification API di browser.
 */

let CapacitorPush = null;
let isNative = false;

// Inisialisasi — panggil sekali di awal
let initPromise = null;
function ensureInit() {
    if (!initPromise) {
        initPromise = (async () => {
            try {
                const { Capacitor } = await import('@capacitor/core');
                isNative = Capacitor.isNativePlatform();
                if (isNative) {
                    const mod = await import('@capacitor/local-notifications');
                    CapacitorPush = mod.LocalNotifications;
                }
            } catch (_) {
                isNative = false;
            }
        })();
    }
    return initPromise;
}

// Jalankan init segera
ensureInit();

/**
 * Request izin notifikasi
 */
export async function requestPermission() {
    await ensureInit();

    if (isNative && CapacitorPush) {
        try {
            const perm = await CapacitorPush.requestPermissions();
            return perm.display === 'granted';
        } catch (_) {
            return false;
        }
    }

    // Web Notification API
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
}

/**
 * Tampilkan notifikasi
 * @param {string} title
 * @param {string} body
 * @param {object} [opts]
 * @param {string} [opts.icon]
 * @param {number} [opts.id]     - unique ID (untuk native)
 */
export async function showNotification(title, body, opts = {}) {
    await ensureInit();

    const icon = opts.icon || '/icons/icon.svg';
    const id = opts.id || Date.now();

    if (isNative && CapacitorPush) {
        try {
            await CapacitorPush.schedule({
                notifications: [
                    {
                        id,
                        title,
                        body,
                        smallIcon: 'ic_stat_icon',
                        iconColor: '#075E54',
                        sound: 'default',
                        actionTypeId: '',
                        extra: {},
                    },
                ],
            });
            return;
        } catch (_) {
            // fallback ke Web Notification
        }
    }

    // Browser fallback
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
        new Notification(title, { body, icon, tag: 'chat' });
    } catch (_) {
        // silent
    }
}
