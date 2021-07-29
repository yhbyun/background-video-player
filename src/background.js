"use strict";

import { app, protocol, BrowserWindow, dialog, ipcMain } from "electron";
import {
    createProtocol,
    installVueDevtools
} from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer';
import { videoSupport } from './ffmpeg-helper';
import VideoServer from './VideoServer';
import Store from 'electron-store';
import services from './default-services';
import { createTray } from './menu';

const isDevelopment = process.env.NODE_ENV !== "production";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let httpServer;
let isRendererReady = false;
let defaultUserAgent;

const store = new Store()

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

    defaultUserAgent = win.webContents.userAgent;

    store.get('options.transparency', true) ? win.setOpacity(store.get('options.opacity', 0.3)) : win.setOpacity(1)
    win.setIgnoreMouseEvents(store.get('options.ignoreMouseEvent'))
    win.setAlwaysOnTop(store.get('options.alwaysOnTop'))

    // Reset The Windows Size and Location
    let windowDetails = store.get('options.windowDetails');
    if (windowDetails) {
        win.setSize(windowDetails.size[0], windowDetails.size[1]);
        win.setPosition(
            windowDetails.position[0],
            windowDetails.position[1]
        );
    } else {
        win.maximize();
    }

    // Detect and update version
    if (!store.get('version')) {
        store.set('version', app.getVersion());
        store.set('services', []);
        console.log('Initialised Config!');
    }

    // Load the services and merge the users and default services
    let userServices = store.get('services') || [];
    global.services = userServices;

    services.forEach(dservice => {
        let service = userServices.find(service => service.name == dservice.name);
        if (service) {
            global.services[userServices.indexOf(service)] = {
                name: service.name ? service.name : dservice.name,
                logo: service.logo ? service.logo : dservice.logo,
                url: service.url ? service.url : dservice.url,
                color: service.color ? service.color : dservice.color,
                style: service.style ? service.style : dservice.style,
                userAgent: service.userAgent ? service.userAgent : dservice.userAgent,
                permissions: service.permissions ? service.permissions : dservice.permissions,
                hidden: service.hidden != undefined ? service.hidden : dservice.hidden,
            };
        } else {
            dservice._defaultService = true;
            global.services.push(dservice);
        }
    });

    let defaultService = store.get('options.defaultService'),
    lastOpenedPage = store.get('options.lastOpenedPage'),
    relaunchToPage = store.get('relaunch.toPage');

    if (relaunchToPage !== undefined) {
        console.log('Relaunching Page ' + relaunchToPage);
        win.loadURL(relaunchToPage);
        store.delete('relaunch.toPage');
    } else if (defaultService == 'lastOpenedPage' && lastOpenedPage) {
        console.log('Loading The Last Opened Page ' + lastOpenedPage);
        win.loadURL(lastOpenedPage);
    } else if (defaultService != undefined) {
        defaultService = global.services.find(
            service => service.name == defaultService
        );
        if (defaultService.url) {
            console.log('Loading The Default Service ' + defaultService.url);
            win.loadURL(defaultService.url);
            win.webContents.userAgent = defaultService.userAgent ? defaultService.userAgent : defaultUserAgent;
        } else {
            console.log(
                "Error Default Service Doesn't Have A URL Set. Falling back to the menu."
            );
            win.loadFile('src/ui/index.html');
        }
    } else {
        if (process.env.WEBPACK_DEV_SERVER_URL) {
            // Load the url of the dev server if in development mode
            win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
            // if (!process.env.IS_TEST) win.webContents.openDevTools();
        } else {
            createProtocol("app");
            // Load the index.html when not in development
            win.loadURL("app://./index.html");
        }
    }

    win.on("close", () => {
        // Save open service if lastOpenedPage is the default service
        if (store.get('options.defaultService') === 'lastOpenedPage') {
            store.set('options.lastOpenedPage', win.getURL());
        }

        // If enabled store the window details so they can be restored upon restart
        if (win) {
            store.set('options.windowDetails', {
                position: win.getPosition(),
                size: win.getSize()
            });
        } else {
            console.error('Error window was not defined while trying to save windowDetails');
        }
    });

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

    createWindow();
    createTray(store, global.services, win);
});

ipcMain.once("ipcRendererReady", (event, args) => {
    console.log("ipcRendererReady")
    isRendererReady = true;
});

ipcMain.on('fileDrop', (event, arg) => {
    console.log("fileDrop:", arg);
    onVideoFileSeleted(arg);
});

ipcMain.on('open-url', (e, service) => {
    console.log('Openning Service ' + service.name);
    win.webContents.userAgent = service.userAgent ? service.userAgent : defaultUserAgent;
    win.loadURL(service.url);
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
            playParams.videoSource = 'file://' + videoFilePath;
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

