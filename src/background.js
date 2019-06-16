"use strict";

import { app, protocol, BrowserWindow, Menu, Tray, nativeImage } from "electron";
import {
    createProtocol,
    installVueDevtools
} from "vue-cli-plugin-electron-builder/lib";
import { config } from './config.js';

const isDevelopment = process.env.NODE_ENV !== "production";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let tray;
let settings;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    { scheme: "app", privileges: { secure: true, standard: true } }
]);

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        transparent: true,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.maximize();
    settings.transparency ? win.setOpacity(settings.opacity) : win.setOpacity(1)
    win.setIgnoreMouseEvents(settings.ignoreMouseEvent)
    win.setAlwaysOnTop(settings.alwaysOnTop);

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
        // if (!process.env.IS_TEST) win.webContents.openDevTools();
    } else {
        createProtocol("app");
        // Load the index.html when not in development
        win.loadURL("app://./index.html");
    }

    win.on("closed", () => {
        win = null;
    });
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
            await installVueDevtools();
        } catch (e) {
            console.error("Vue Devtools failed to install:", e.toString());
        }
    }

    settings = {
        transparency: config.get('transparency', true),
        opacity: config.get('opacity', 0.3),
        alwaysOnTop: config.get('alwaysOnTop', true),
        ignoreMouseEvent: config.get('ignoreMouseEvent', true),
    };

    createTray();
    createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === "win32") {
        process.on("message", data => {
            if (data === "graceful-exit") {
                app.quit();
            }
        });
    } else {
        process.on("SIGTERM", () => {
            app.quit();
        });
    }
}

function createTray() {
    tray = new Tray(nativeImage.createEmpty())
    tray.setTitle('Video')
    tray.setToolTip('Video')

    let contextMenu = Menu.buildFromTemplate([
        { label: 'Open File', click() { win.focus(); win.webContents.send('openFile') } },
        { label: 'Play', click() { play() } },
        { label: 'Pause', click() { pause() } },
        { type: 'separator' },
        { label: 'Transparency',
            submenu: [
                {
                    label: 'Enabled',
                    id: 'transparency',
                    type: 'checkbox',
                    accelerator: process.platform === 'darwin' ? 'Command+Ctrl+Shift+O' : 'Ctrl+T',
                    checked: settings.transparency,
                    click: () => toggleTransparency(),
                },
                { label: 'Opacity',
                    submenu: [
                        { label: '10%', type: 'radio', checked: settings.opacity === 0.1, click(item) { setOpacity(item, 0.1) } },
                        { label: '20%', type: 'radio', checked: settings.opacity === 0.2, click(item) { setOpacity(item, 0.2) } },
                        { label: '30%', type: 'radio', checked: settings.opacity === 0.3, click(item) { setOpacity(item, 0.3) } },
                        { label: '40%', type: 'radio', checked: settings.opacity === 0.4, click(item) { setOpacity(item, 0.4) } },
                        { label: '50%', type: 'radio', checked: settings.opacity === 0.5, click(item) { setOpacity(item, 0.5) } },
                        { label: '60%', type: 'radio', checked: settings.opacity === 0.6 , click(item) { setOpacity(item, 0.6) } },
                        { label: '70%', type: 'radio', checked: settings.opacity === 0.7, click(item) { setOpacity(item, 0.7) } },
                        { label: '80%', type: 'radio', checked: settings.opacity === 0.8, click(item) { setOpacity(item, 0.8) } },
                        { label: '90%', type: 'radio', checked: settings.opacity === 0.9, click(item) { setOpacity(item, 0.9) } },
                        { label: '100%', type: 'radio', checked: settings.opacity === 1, click(item) { setOpacity(item, 1) } },
                    ],
                },
            ]
        },
        {
            label: 'Always on top',
            id: 'alwaysontop',
            type: 'checkbox',
            accelerator: process.platform === 'darwin' ? 'Command+Ctrl+Shift+A' : 'Ctrl+A',
            checked: settings.alwaysOnTop,
            click: () => toggleAlwaysOnTop(),
        },
        {
            label: 'Disable Mouse',
            id: 'ignore-mouse-event',
            type: 'checkbox',
            accelerator: process.platform === 'darwin' ? 'Command+Ctrl+Shift+M' : 'Ctrl+A',
            checked: settings.ignoreMouseEvent,
            click: () => toggleIgnoreMouseEvent(),
        },
        { type: 'separator' },
        { role: 'quit' },
    ])

    tray.setContextMenu(contextMenu)
}

function play() {
    win.webContents.send('play-control', 'play')
}

function pause() {
    win.webContents.send('play-control', 'pause')
}

function toggleTransparency() {
    settings.transparency = !settings.transparency
    config.set('transparency', settings.transparency)

    settings.transparency ? win.setOpacity(settings.opacity) : win.setOpacity(1)
}

function toggleAlwaysOnTop() {
    settings.alwaysOnTop = !settings.alwaysOnTop
    config.set('alwaysOnTop', settings.alwaysOnTop)

    win.setAlwaysOnTop(settings.alwaysOnTop)
}

function toggleIgnoreMouseEvent() {
    settings.ignoreMouseEvent = !settings.ignoreMouseEvent
    config.set('ignoreMouseEvent', settings.ignoreMouseEvent)

    win.setIgnoreMouseEvents(settings.ignoreMouseEvent)
}

function setOpacity(item, opacity) {
    item.checked = true
    settings.opacity = opacity
    config.set('opacity', settings.opacity)
    win.setOpacity(settings.opacity)
}
