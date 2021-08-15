import {
    app,
    protocol,
    BrowserWindow,
    ipcMain,
    screen,
    session,
} from 'electron';
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer';
import WindowManager from './window-manager';
import WindowUtils from './window-utils';
import SideDock from './side-dock';
import { playVideo } from './video-manager';
import { logManager } from './log-manager';
import config from './config';
import status from './status';
import path from 'path';

let logger = logManager.getLogger('Main');

// const headerScript = fs.readFileSync(
//     path.join(__dirname, 'client-header.js'),
//     'utf8'
// );

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true } },
]);

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
    if (config.isDev && !config.isTest) {
        // Install Vue Devtools
        try {
            await installExtension(VUEJS3_DEVTOOLS);
        } catch (e) {
            logger.error('Vue Devtools failed to install:', e.toString());
        }
    }

    try {
        const ext = await session.defaultSession.loadExtension(
            path.join(config.root, 'extensions/nflxmultisubs')
        );
        logger.info('ext', ext);
    } catch (e) {
        logger.error(
            'NflxMultiSubs(Netflix Multi. Subtitles) chrome extension failed to install:',
            e.toString()
        );
    }

    WindowManager.openMainWindow();
    WindowManager.setTrayWindow();
});

ipcMain.once('ipcRendererReady', (event, args) => {
    status.isRendererReady = true;
});

ipcMain.on('fileDrop', (event, arg) => {
    logger.debug('fileDrop:', arg);
    playVideo(arg);
});

ipcMain.handle('getStoreValue', (event, ...args) => {
    return config.persisted.get(args[0], args[1]);
});

ipcMain.handle('getStatus', (event, key) => {
    return status[key];
});

ipcMain.on('setStatus', (event, key, value) => {
    status[key] = value;
});

ipcMain.on('mouseEnter', (event, args) => {
    mouseEnter();
});

ipcMain.on('mouseLeave', (event, args) => {
    mouseLeave();
});

ipcMain.on('toggleSidedock', (event, enable) => {
    enable ? SideDock.activateSidedock() : SideDock.deactivateSidedock();
});

// Exit cleanly on request from parent process in development mode.
if (config.isDev) {
    if (config.isWin) {
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

function broswerWindowDomReady() {
    logger.debug('broswerWindowDomReady');
    // win.webContents.executeJavaScript(headerScript);
}

function mouseEnter() {
    logger.debug(
        'mouseenter',
        'resizing:' + status.resizing,
        'inZoom:' + status.inZoom
    );

    if (WindowUtils.isSidedockMode()) {
        SideDock.handleMouseEnterOnSidedock();
        return;
    }

    if (
        config.persisted.get('options.transparency') &&
        (!WindowUtils.isTransparentZoomEnabled() ||
            (!status.resizing && !status.inZoom))
    ) {
        if (
            ['mouse_over_zoom', 'mouse_out_zoom'].indexOf(
                config.persisted.get('options.transparent_mode')
            ) >= 0
        ) {
            const { width, height } = screen.getPrimaryDisplay().workAreaSize;
            const bounds = WindowManager.mainWindow.getBounds();
            status.orgBounds = Object.assign({}, bounds);

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

            status.resizing = true;
            status.inZoom = true;
            WindowManager.mainWindow.setBounds(bounds, true);
        }

        WindowUtils.setWindowOpacity(true);
    }
}

function mouseLeave() {
    logger.debug(
        'mouseleave',
        'resizing:' + status.resizing,
        'inZoom:' + status.inZoom
    );

    if (WindowUtils.isSidedockMode()) {
        SideDock.handleMouseLeaveOnSidedock();
        return;
    }

    if (
        WindowUtils.isTransparentZoomEnabled() &&
        (status.resizing || !status.inZoom)
    )
        return;

    if (WindowUtils.isMouseOverWindow()) {
        logger.debug("Ignore mosueleave. It's wrong.");
        return;
    }

    if (config.persisted.get('options.transparency')) {
        if (WindowUtils.isTransparentZoomEnabled()) {
            status.resizing = true;
            status.inZoom = false;
            WindowManager.mainWindow.setBounds(status.orgBounds, true);
        }

        WindowUtils.setWindowOpacity(false);
    }
}
