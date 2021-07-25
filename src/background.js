"use strict";

import { app, protocol, BrowserWindow, Menu, Tray, nativeImage, dialog, ipcMain } from "electron";
import {
    createProtocol,
    installVueDevtools
} from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer';
import { config } from './config.js';
import { videoSupport } from './ffmpeg-helper';
import VideoServer from './VideoServer';

const isDevelopment = process.env.NODE_ENV !== "production";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let tray;
let settings;
let httpServer;
let isRendererReady = false;

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
             // Use pluginOptions.nodeIntegration, leave this alone
            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
            // nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
            // contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webSecurity: false,
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
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
            await installExtension(VUEJS3_DEVTOOLS)
        } catch (e) {
            console.error('Vue Devtools failed to install:', e.toString())
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

ipcMain.once("ipcRendererReady", (event, args) => {
    console.log("ipcRendererReady")
    isRendererReady = true;
});

ipcMain.on('fileDrop', (event, arg) => {
    console.log("fileDrop:", arg);
    onVideoFileSeleted(arg);
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

function onVideoFileSeleted(videoFilePath) {
    videoSupport(videoFilePath).then((checkResult) => {
        if (checkResult.videoCodecSupport && checkResult.audioCodecSupport) {
            if (httpServer) {
                httpServer.killFfmpegCommand();
            }
            let playParams = {};
            playParams.type = "native";
            playParams.videoSource = videoFilePath;
            if (isRendererReady) {
                console.log("fileSelected=", playParams)

                win.webContents.send('fileSelected', playParams);
            } else {
                ipcMain.once("ipcRendererReady", (event, args) => {
                    console.log("fileSelected", playParams)
                    win.webContents.send('fileSelected', playParams);
                    isRendererReady = true;
                })
            }
        } else {
            if (!httpServer) {
                httpServer = new VideoServer();
            }
            httpServer.videoSourceInfo = { videoSourcePath: videoFilePath, checkResult: checkResult };
            httpServer.createServer();
            console.log("createVideoServer success");
            let playParams = {};
            playParams.type = "stream";
            playParams.videoSource = "http://127.0.0.1:8888?startTime=0";
            playParams.duration = checkResult.duration
            if (isRendererReady) {
                console.log("fileSelected=", playParams)

                win.webContents.send('fileSelected', playParams);
            } else {
                ipcMain.once("ipcRendererReady", (event, args) => {
                    console.log("fileSelected", playParams)
                    win.webContents.send('fileSelected', playParams);
                    isRendererReady = true;
                })
            }
        }
    }).catch((err) => {
        console.log("video format error", err);
        const options = {
            type: 'info',
            title: 'Error',
            message: "It is not a video file!",
            buttons: ['OK']
        }
        dialog.showMessageBox(options, function (index) {
            console.log("showMessageBox", index);
        })
    })
}

function createTray() {
    tray = new Tray(nativeImage.createEmpty())
    tray.setTitle('Video')
    tray.setToolTip('Video')

    let contextMenu = Menu.buildFromTemplate([
        { label: 'Open File', click() { openFile() } },
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

function openFile() {
    win.focus();

    dialog.showOpenDialog({
        properties: ['openFile'],
        // filters: [
        //     {name: 'Movies', extensions: ['mkv', 'avi', 'mp4', 'rmvb', 'flv', 'ogv','webm', '3gp', 'mov']},
        // ]
    }).then((result) => {
        let canceled = result.canceled;
        let filePaths = result.filePaths;
        if (!canceled && win && filePaths.length > 0) {
            onVideoFileSeleted(filePaths[0])
        }
    });
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
