'use strict';

import {
    app,
    protocol,
    BrowserWindow,
    Tray,
    Menu,
    dialog,
    ipcMain,
    screen,
} from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer';
import { videoSupport } from './ffmpeg-helper';
import VideoServer from './VideoServer';
import Store from 'electron-store';
import services from './default-services';
import { getTrayMenu, getApplicationMenu } from './menu';
import path from 'path';
import fs from 'fs';

const isDevelopment = process.env.NODE_ENV !== 'production';

// const headerScript = fs.readFileSync(
//     path.join(__dirname, 'client-header.js'),
//     'utf8'
// );

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let httpServer;
let tray;
let isRendererReady = false;
let defaultUserAgent;
let orgBounds;
let resizing = false,
    inZoom = false;

const store = new Store();

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true } },
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
            webviewTag: true,
            // preload: path.join(__dirname, 'preload.js'),
        },
    });

    defaultUserAgent = win.webContents.userAgent;

    store.get('options.transparency', true)
        ? win.setOpacity(store.get('options.opacity', 0.3))
        : win.setOpacity(1);
    win.setIgnoreMouseEvents(store.get('options.ignoreMouseEvent'));
    win.setAlwaysOnTop(store.get('options.alwaysOnTop'));

    // Reset The Windows Size and Location
    let windowDetails = store.get('options.windowDetails');
    if (windowDetails) {
        win.setSize(windowDetails.size[0], windowDetails.size[1]);
        win.setPosition(windowDetails.position[0], windowDetails.position[1]);
    } else {
        win.maximize();
    }

    store.set('options.sidedock', false);

    // Detect and update version
    if (!store.get('version')) {
        store.set('version', app.getVersion());
        store.set('services', []);
        console.log('Initialised Config!');
    }

    // Load the services and merge the users and default services
    let userServices = store.get('services') || [];
    global.services = userServices;

    services.forEach((dservice) => {
        let service = userServices.find(
            (service) => service.name == dservice.name
        );
        if (service) {
            global.services[userServices.indexOf(service)] = {
                name: service.name ? service.name : dservice.name,
                logo: service.logo ? service.logo : dservice.logo,
                url: service.url ? service.url : dservice.url,
                color: service.color ? service.color : dservice.color,
                style: service.style ? service.style : dservice.style,
                userAgent: service.userAgent
                    ? service.userAgent
                    : dservice.userAgent,
                permissions: service.permissions
                    ? service.permissions
                    : dservice.permissions,
                hidden:
                    service.hidden != undefined
                        ? service.hidden
                        : dservice.hidden,
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
            (service) => service.name == defaultService
        );
        if (defaultService.url) {
            console.log('Loading The Default Service ' + defaultService.url);
            win.loadURL(defaultService.url);
            win.webContents.userAgent = defaultService.userAgent
                ? defaultService.userAgent
                : defaultUserAgent;
        } else {
            console.log(
                "Error Default Service Doesn't Have A URL Set. Falling back to the empty page."
            );
            if (process.env.WEBPACK_DEV_SERVER_URL) {
                // Load the url of the dev server if in development mode
                win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
                // if (!process.env.IS_TEST) win.webContents.openDevTools();
            } else {
                createProtocol('app');
                // Load the index.html when not in development
                win.loadURL('app://./index.html');
            }
        }
    } else {
        if (process.env.WEBPACK_DEV_SERVER_URL) {
            // Load the url of the dev server if in development mode
            win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
            // if (!process.env.IS_TEST) win.webContents.openDevTools();
        } else {
            createProtocol('app');
            // Load the index.html when not in development
            win.loadURL('app://./index.html');
        }
    }

    win.webContents.on('dom-ready', broswerWindowDomReady);

    win.on('close', () => {
        // Save open service if lastOpenedPage is the default service
        if (store.get('options.defaultService') === 'lastOpenedPage') {
            store.set('options.lastOpenedPage', win.getURL());
        }

        // If enabled store the window details so they can be restored upon restart
        if (win) {
            store.set('options.windowDetails', {
                position: isSidedockMode
                    ? [orgBounds.x, orgBounds.y]
                    : win.getPosition(),
                size: isSidedockMode()
                    ? [orgBounds.width, orgBounds.height]
                    : win.getSize(),
            });
        } else {
            console.error(
                'Error window was not defined while trying to save windowDetails'
            );
        }
    });

    win.on('resized', () => {
        if (resizing) {
            resizing = false;
        } else if (isSidedockMode()) {
            orgBounds = Object.assign({}, win.getBounds());
        }
    });

    win.on('closed', () => {
        win = null;
    });

    // Emitted when website requests permissions - Electron default allows any permission this restricts websites
    win.webContents.session.setPermissionRequestHandler(
        (webContents, permission, callback) => {
            let websiteOrigin = new URL(webContents.getURL()).origin;
            let service = global.services.find(
                (service) => new URL(service.url).origin == websiteOrigin
            );

            if (
                (service &&
                    service.permissions &&
                    service.permissions.includes(permission)) ||
                permission == 'fullscreen'
            ) {
                console.log(
                    `Allowed Requested Browser Permission '${permission}' For Site '${websiteOrigin}'`
                );
                return callback(true);
            }

            console.log(
                `Rejected Requested Browser Permission '${permission}' For Site '${websiteOrigin}'`
            );
            return callback(false);
        }
    );
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
            await installExtension(VUEJS3_DEVTOOLS);
        } catch (e) {
            console.error('Vue Devtools failed to install:', e.toString());
        }
    }

    createWindow();
    Menu.setApplicationMenu(
        getApplicationMenu(store, global.services, win, app)
    );

    tray = new Tray(path.join(__static, 'icon@32.png'));
    tray.setToolTip('Video');
    tray.setContextMenu(getTrayMenu(store, global.services, win));
});

ipcMain.once('ipcRendererReady', (event, args) => {
    console.log('ipcRendererReady');
    isRendererReady = true;
});

ipcMain.on('fileDrop', (event, arg) => {
    console.log('fileDrop:', arg);
    onVideoFileSeleted(arg);
});

ipcMain.handle('getStoreValue', (event, ...args) => {
    return store.get(args[0], args[1]);
});

ipcMain.on('mouseEnter', (event, args) => {
    mouseEnter();
});

ipcMain.on('mouseLeave', (event, args) => {
    mouseLeave();
});

ipcMain.on('toggleSidedock', (event, enable) => {
    enable ? activateSidedock() : deactivateSidedock();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
            if (data === 'graceful-exit') {
                app.quit();
            }
        });
    } else {
        process.on('SIGTERM', () => {
            app.quit();
        });
    }
}

function onVideoFileSeleted(videoFilePath) {
    videoSupport(videoFilePath)
        .then((checkResult) => {
            if (
                checkResult.videoCodecSupport &&
                checkResult.audioCodecSupport
            ) {
                if (httpServer) {
                    httpServer.killFfmpegCommand();
                }
                let playParams = {};
                playParams.type = 'native';
                playParams.videoSource = 'file://' + videoFilePath;
                if (isRendererReady) {
                    console.log('fileSelected=', playParams);

                    win.webContents.send('fileSelected', playParams);
                } else {
                    ipcMain.once('ipcRendererReady', (event, args) => {
                        console.log('fileSelected', playParams);
                        win.webContents.send('fileSelected', playParams);
                        isRendererReady = true;
                    });
                }
            } else {
                if (!httpServer) {
                    httpServer = new VideoServer();
                }
                httpServer.videoSourceInfo = {
                    videoSourcePath: videoFilePath,
                    checkResult: checkResult,
                };
                httpServer.createServer();
                console.log('createVideoServer success');
                let playParams = {};
                playParams.type = 'stream';
                playParams.videoSource = 'http://127.0.0.1:8888?startTime=0';
                playParams.duration = checkResult.duration;
                if (isRendererReady) {
                    console.log('fileSelected=', playParams);

                    win.webContents.send('fileSelected', playParams);
                } else {
                    ipcMain.once('ipcRendererReady', (event, args) => {
                        console.log('fileSelected', playParams);
                        win.webContents.send('fileSelected', playParams);
                        isRendererReady = true;
                    });
                }
            }
        })
        .catch((err) => {
            console.log('video format error', err);
            const options = {
                type: 'info',
                title: 'Error',
                message: 'It is not a video file!',
                buttons: ['OK'],
            };
            dialog.showMessageBox(options, function (index) {
                console.log('showMessageBox', index);
            });
        });
}

function broswerWindowDomReady() {
    console.log('broswerWindowDomReady');
    // win.webContents.executeJavaScript(headerScript);
}

function isMouseOverWindow() {
    // Check that the mouse is over the window
    const { x, y } = screen.getCursorScreenPoint();
    const bounds = win.getBounds();

    // console.log(x, y);
    // console.log(bounds);

    return (
        x >= bounds.x &&
        y >= bounds.y &&
        x < bounds.x + bounds.width &&
        y < bounds.y + bounds.height
    );
}

function mouseEnter() {
    console.log('mouseenter', 'resizing:' + resizing, 'inZoom:' + inZoom);

    if (isSidedockMode()) {
        handleMouseEnterOnSidedock();
        return;
    }

    if (
        store.get('options.transparency') &&
        (!isTransparentZoomEnabled() || (!resizing && !inZoom))
    ) {
        if (
            ['mouse_over_zoom', 'mouse_out_zoom'].indexOf(
                store.get('options.transparent_mode')
            ) >= 0
        ) {
            const { width, height } = screen.getPrimaryDisplay().workAreaSize;
            const bounds = win.getBounds();
            orgBounds = Object.assign({}, bounds);

            if (bounds.x && bounds.x + bounds.width * 2 > width) {
                bounds.x -= bounds.width;
                if (bounds.x < 0) bounds.x = 0;
            }

            if (bounds.y && bounds.y + bounds.height * 2 > height) {
                bounds.y -= bounds.height;
                if (bounds.y < 0) bounds.y = 0;
            }

            bounds.width += bounds.width;
            bounds.height += bounds.height;

            if (bounds.width > width) bounds.width = width;
            if (bounds.height > height) bounds.height = height;

            resizing = true;
            inZoom = true;
            win.setBounds(bounds, true);
        }

        setWindowOpacity(true);
    }
}

function mouseLeave() {
    console.log('mouseleave', 'resizing:' + resizing, 'inZoom:' + inZoom);

    if (isSidedockMode()) {
        handleMouseLeaveOnSidedock();
        return;
    }

    if (isTransparentZoomEnabled() && (resizing || !inZoom)) return;

    if (isMouseOverWindow()) {
        console.log("Ignore mosueleave. It's wrong.");
        return;
    }

    if (store.get('options.transparency')) {
        if (isTransparentZoomEnabled()) {
            resizing = true;
            inZoom = false;
            win.setBounds(orgBounds, true);
        }

        setWindowOpacity(false);
    }
}

function isTransparentZoomEnabled() {
    return (
        ['mouse_over_zoom', 'mouse_out_zoom'].indexOf(
            store.get('options.transparent_mode')
        ) >= 0
    );
}

function setWindowOpacity(hover) {
    if (store.get('options.transparency')) {
        const opacity = store.get('options.opacity', 0.3);

        switch (store.get('options.transparent_mode')) {
            case 'mouse_over':
            case 'mouse_over_zoom':
                hover ? win.setOpacity(opacity) : win.setOpacity(1);
                break;

            case 'mouse_out':
            case 'mouse_out_zoom':
                hover ? win.setOpacity(1) : win.setOpacity(opacity);
                break;
        }
    }
}

function isSidedockMode() {
    return store.get('options.sidedock', false);
}

function activateSidedock() {
    orgBounds = Object.assign({}, win.getBounds());

    resizing = true;
    inZoom = false;
    win.setBounds({ x: 0, width: 30 }, true);
    setWindowOpacity(false);
}

function deactivateSidedock() {
    resizing = true;
    inZoom = true;
    win.setBounds(orgBounds, true);
    setWindowOpacity(false);
}

function handleMouseEnterOnSidedock() {
    if (resizing || inZoom) return;

    resizing = true;
    inZoom = true;
    win.setBounds(
        {
            width: orgBounds.width,
        },
        true
    );
    setWindowOpacity(true);
}

function handleMouseLeaveOnSidedock() {
    if (resizing || !inZoom) return;

    if (isMouseOverWindow()) {
        console.log("Ignore mosueleave. It's wrong.");
        return;
    }

    resizing = true;
    inZoom = false;
    win.setBounds({ width: 30 }, true);
    setWindowOpacity(false);
}
