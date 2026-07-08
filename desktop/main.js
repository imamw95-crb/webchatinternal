const {
    app,
    BrowserWindow,
    Tray,
    Menu,
    Notification,
    shell,
    nativeImage,
    ipcMain,
    dialog,
} = require('electron');
const path = require('path');
const fs = require('fs');

// ============================================================
// Configuration
// ============================================================
const isDev = process.argv.includes('--dev');
const APP_NAME = 'RSMP Chat';
const APP_URL = 'https://chat.cloudnod.my.id';

let mainWindow = null;
let tray = null;
let isQuitting = false;

// ============================================================
// App Paths
// ============================================================
const ASSETS_PATH = path.join(__dirname, 'assets');
const iconPath = path.join(ASSETS_PATH, 'icon.png');
const trayIconPath = path.join(ASSETS_PATH, 'tray-icon.png');
const iconIcoPath = path.join(ASSETS_PATH, 'icon.ico');

// ============================================================
// Create Main Window
// ============================================================
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: APP_NAME,
        icon: iconPath,
        show: true, // Show immediately
        backgroundColor: '#0f172a',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            spellcheck: true,
        },
    });

    // Log renderer console
    mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
        const lbl = ['verbose', 'info', 'warning', 'error'][level] || 'log';
        console.log(`[renderer:${lbl}] ${message}`);
    });

    // Log when page finishes loading
    mainWindow.webContents.on('did-finish-load', () => {
        const title = mainWindow.getTitle();
        console.log(`Page loaded: "${title}"`);
        mainWindow.webContents.executeJavaScript(`
            JSON.stringify({
                title: document.title,
                url: window.location.href,
                bodyLen: document.body?.innerHTML?.length || 0,
                hasApp: !!document.querySelector('#app'),
                readyState: document.readyState,
            })
        `).then((json) => {
            const info = JSON.parse(json);
            console.log(`Page info: title="${info.title}" url="${info.url}" bodyLen=${info.bodyLen} hasApp=${info.hasApp} state=${info.readyState}`);
        }).catch((err) => {
            console.error(`executeJavaScript error: ${err.message}`);
        });
    });

    // Log load failures
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
        if (isMainFrame) {
            console.error(`[FAIL] ${validatedURL} -> ${errorDescription} (${errorCode})`);
        }
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Minimize to tray instead of closing
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Load the app
    console.log(`Loading: ${APP_URL}`);
    mainWindow.loadURL(APP_URL).catch((err) => {
        console.error(`loadURL failed: ${err.message}`);
        // Show error page
        mainWindow.loadFile(path.join(__dirname, 'assets', 'error.html'));
    });

    // Open DevTools in dev mode
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
}

// ============================================================
// System Tray
// ============================================================
function createTray() {
    const trayIcon = nativeImage.createFromPath(trayIconPath).resize({ width: 16, height: 16 });
    tray = new Tray(trayIcon);
    tray.setToolTip(APP_NAME);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Buka Aplikasi',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            },
        },
        { type: 'separator' },
        {
            label: 'Keluar',
            click: () => {
                isQuitting = true;
                app.quit();
            },
        },
    ]);

    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

// ============================================================
// Application Menu
// ============================================================
function createAppMenu() {
    const template = [
        {
            label: APP_NAME,
            submenu: [
                { role: 'about', label: 'Tentang ' + APP_NAME },
                { type: 'separator' },
                { role: 'quit', label: 'Keluar' },
            ],
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo', label: 'Undo' },
                { role: 'redo', label: 'Redo' },
                { type: 'separator' },
                { role: 'cut', label: 'Potong' },
                { role: 'copy', label: 'Salin' },
                { role: 'paste', label: 'Tempel' },
                { role: 'selectAll', label: 'Pilih Semua' },
            ],
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload', label: 'Reload' },
                { role: 'forceReload', label: 'Force Reload' },
                { type: 'separator' },
                { role: 'resetZoom', label: 'Reset Zoom' },
                { role: 'zoomIn', label: 'Zoom In' },
                { role: 'zoomOut', label: 'Zoom Out' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: 'Fullscreen' },
                ...(isDev
                    ? [
                          { type: 'separator' },
                          { role: 'toggleDevTools', label: 'DevTools' },
                      ]
                    : []),
            ],
        },
        {
            label: 'Bantuan',
            submenu: [
                {
                    label: 'Tentang Aplikasi',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Tentang ' + APP_NAME,
                            message: APP_NAME,
                            detail:
                                'Aplikasi Chat Internal RSMP Patrol\n' +
                                'Versi: ' + app.getVersion() + '\n' +
                                'Electron: ' + process.versions.electron + '\n' +
                                'Chrome: ' + process.versions.chrome + '\n' +
                                'Node.js: ' + process.versions.node,
                        });
                    },
                },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// ============================================================
// Native Notification Handler
// ============================================================
function showNotification(title, body, options = {}) {
    if (Notification.isSupported()) {
        const notification = new Notification({
            title: title || APP_NAME,
            body: body || '',
            icon: iconPath,
            ...options,
        });

        notification.on('click', () => {
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
            }
        });

        notification.show();
    }
}

// ============================================================
// IPC Handlers
// ============================================================
function setupIPC() {
    // Receive notification requests from renderer
    ipcMain.on('show-notification', (_event, { title, body, tag }) => {
        showNotification(title, body, { tag });
    });

    // Get app version
    ipcMain.handle('get-app-version', () => {
        return app.getVersion();
    });

    // Get app URL
    ipcMain.handle('get-app-url', () => {
        return APP_URL;
    });

    // Open external link
    ipcMain.handle('open-external', (_event, url) => {
        shell.openExternal(url);
    });
}

// ============================================================
// App Lifecycle
// ============================================================
app.whenReady().then(() => {
    createAppMenu();
    createMainWindow();
    createTray();
    setupIPC();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        } else if (mainWindow) {
            mainWindow.show();
        }
    });
});

app.on('before-quit', () => {
    isQuitting = true;
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Don't quit — keep running in tray
    }
});
