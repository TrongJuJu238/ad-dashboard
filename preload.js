const { contextBridge, ipcRenderer } = require('electron');

// ============================================================
//  EXPOSE SAFE API TO RENDERER
// ============================================================
contextBridge.exposeInMainWorld('electronAPI', {

    // ---- System Info ----
    getWindowsUser: () => ipcRenderer.invoke('get-windows-user'),
    getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),

    // ---- Window Controls ----
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),

    // ---- Navigation ----
    navigateToDashboard: () => ipcRenderer.invoke('navigate-to-dashboard'),

    // ---- Floating Icon ----
    floatingClick: () => ipcRenderer.invoke('floating-click'),
    floatingMove: (x, y) => ipcRenderer.invoke('floating-move', { x, y }),
    floatingGetPosition: () => ipcRenderer.invoke('floating-get-position'),
    showFloatingMenu: () => ipcRenderer.invoke('show-floating-menu'),

    // ---- App ----
    quit: () => ipcRenderer.invoke('app-quit')
});
