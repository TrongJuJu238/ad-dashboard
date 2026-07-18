const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// ============================================================
//  GLOBAL REFERENCES
// ============================================================
let mainWindow = null;
let floatingWindow = null;
let tray = null;
let pythonBackend = null;

const BACKEND_PORT = 5050;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const isDev = process.argv.includes('--dev');

// ============================================================
//  PYTHON BACKEND MANAGEMENT
// ============================================================
function startBackend() {
    const backendPath = path.join(__dirname, 'backend', 'server.py');
    
    pythonBackend = spawn('python', [backendPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, FLASK_PORT: BACKEND_PORT.toString() }
    });

    pythonBackend.stdout.on('data', (data) => {
        console.log(`[Backend] ${data.toString().trim()}`);
    });

    pythonBackend.stderr.on('data', (data) => {
        console.error(`[Backend Error] ${data.toString().trim()}`);
    });

    pythonBackend.on('close', (code) => {
        console.log(`[Backend] Process exited with code ${code}`);
    });

    console.log('[Backend] Starting Python backend on port', BACKEND_PORT);
}

function stopBackend() {
    if (pythonBackend) {
        pythonBackend.kill();
        pythonBackend = null;
        console.log('[Backend] Stopped');
    }
}

// ============================================================
//  MAIN WINDOW
// ============================================================
function createMainWindow() {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
        width: Math.min(1400, screenWidth),
        height: Math.min(900, screenHeight),
        minWidth: 900,
        minHeight: 600,
        frame: false,              // Custom title bar
        transparent: false,
        backgroundColor: '#0a0e1a',
        icon: path.join(__dirname, 'renderer', 'img', 'icon.png'),
        show: false,               // Show when ready
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: isDev
        }
    });

    // Load login page first
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.center();
        if (isDev) mainWindow.webContents.openDevTools();
    });

    // Minimize instead of close — keep floating icon alive
    mainWindow.on('close', (e) => {
        if (!app.isQuitting) {
            e.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// ============================================================
//  FLOATING ICON WINDOW
// ============================================================
function createFloatingWindow() {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    floatingWindow = new BrowserWindow({
        width: 60,
        height: 60,
        x: screenWidth - 80,
        y: Math.floor(screenHeight / 2) - 30,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        hasShadow: false,
        focusable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    floatingWindow.loadFile(path.join(__dirname, 'renderer', 'floating.html'));
    floatingWindow.setAlwaysOnTop(true, 'screen-saver');

    floatingWindow.on('closed', () => {
        floatingWindow = null;
    });
}

// ============================================================
//  SYSTEM TRAY
// ============================================================
function createTray() {
    // Use a simple 16x16 icon for tray
    const trayIcon = nativeImage.createEmpty();
    tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
        { 
            label: 'Show App', 
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        { type: 'separator' },
        { 
            label: 'Quit', 
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('IT Helpdesk');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

// ============================================================
//  IPC HANDLERS
// ============================================================
function setupIPC() {
    // Get Windows logged-in username
    ipcMain.handle('get-windows-user', () => {
        return {
            username: process.env.USERNAME || process.env.USER || 'unknown',
            domain: process.env.USERDOMAIN || '',
            computerName: process.env.COMPUTERNAME || ''
        };
    });

    // Get backend URL
    ipcMain.handle('get-backend-url', () => {
        return BACKEND_URL;
    });

    // Window controls (custom title bar)
    ipcMain.handle('window-minimize', () => {
        if (mainWindow) mainWindow.minimize();
    });

    ipcMain.handle('window-maximize', () => {
        if (mainWindow) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            } else {
                mainWindow.maximize();
            }
        }
    });

    ipcMain.handle('window-close', () => {
        if (mainWindow) mainWindow.hide();
    });

    // Navigate to dashboard after login
    ipcMain.handle('navigate-to-dashboard', () => {
        if (mainWindow) {
            mainWindow.loadFile(path.join(__dirname, 'renderer', 'dashboard.html'));
        }
    });

    // Floating icon click → show main window
    ipcMain.handle('floating-click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });

    // Move floating window (for drag support)
    ipcMain.handle('floating-move', (event, { x, y }) => {
        if (floatingWindow) {
            floatingWindow.setPosition(Math.round(x), Math.round(y));
        }
    });

    // Get floating window position
    ipcMain.handle('floating-get-position', () => {
        if (floatingWindow) {
            const pos = floatingWindow.getPosition();
            return { x: pos[0], y: pos[1] };
        }
        return { x: 0, y: 0 };
    });

    ipcMain.handle('show-floating-menu', () => {
        const menu = Menu.buildFromTemplate([
            { label: 'Show App', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } } },
            { type: 'separator' },
            { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
        ]);
        menu.popup();
    });

    // Quit app
    ipcMain.handle('app-quit', () => {
        app.isQuitting = true;
        app.quit();
    });
}

// ============================================================
//  APP LIFECYCLE
// ============================================================
app.whenReady().then(() => {
    setupIPC();
    startBackend();

    // Small delay to let backend start
    setTimeout(() => {
        createMainWindow();
        createFloatingWindow();
        // createTray();  // Enable when icon is ready
    }, 1500);
});

app.on('window-all-closed', () => {
    // On Windows, don't quit — floating icon keeps running
    // App quits only via tray or floating icon context menu
});

app.on('before-quit', () => {
    app.isQuitting = true;
    stopBackend();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createMainWindow();
    }
});
