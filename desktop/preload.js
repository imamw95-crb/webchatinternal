const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Notifications
    showNotification: (title, body, options = {}) => {
        ipcRenderer.send('show-notification', { title, body, ...options });
    },

    // App info
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppUrl: () => ipcRenderer.invoke('get-app-url'),

    // External links
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
