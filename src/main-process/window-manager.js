import { app, ipcMain, BrowserWindow, Tray } from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import MenuBuilder, { getTrayMenu } from './menu-builder';
import services from '../default-services';
import config from './config';
import status from './status';
import { logManager } from './log-manager';
import WindowUtils from './window-utils';

let logger = logManager.getLogger('WindowManager');

export const sendToMainWindow = (key, message = '') => {
    if (WindowManager.mainWindow) {
        WindowManager.mainWindow.webContents.send(key, message);
    } else {
        logger.debug(`MainWindow not defined yet, not sending ${key}`);
    }
};

export default class WindowManager {
    static mainWindow;
    static tray;

    static initMenus() {
        const menuBuilder = new MenuBuilder();
        menuBuilder.buildMenu();
    }

    static createMainWindow() {
        logger.debug('Creating main window.');

        this.mainWindow = new BrowserWindow({
            transparent: true,
            frame: false,
            show: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true,
                webSecurity: false,
                webviewTag: true,
            },
            title: 'Background Video Player',
        });

        status.defaultUserAgent = this.mainWindow.webContents.userAgent;
    }

    static setMainWindow(showOnLoad = true) {
        this.createMainWindow();

        config.persisted.get('options.transparency', true)
            ? this.mainWindow.setOpacity(
                  config.persisted.get('options.opacity', 0.3)
              )
            : this.mainWindow.setOpacity(1);

        this.mainWindow.setIgnoreMouseEvents(
            config.persisted.get('options.ignoreMouseEvent')
        );
        this.mainWindow.setAlwaysOnTop(
            config.persisted.get('options.alwaysOnTop')
        );

        // Reset The Windows Size and Location
        const windowSize = config.persisted.get('options.windowSize');
        if (windowSize) {
            this.mainWindow.setBounds(windowSize);
        } else {
            this.mainWindow.maximize();
        }

        // if (app.dock && showOnLoad) {
        //     logger.debug('Show dock window.');
        //     app.dock.show();
        // }

        // if (openMaximized && showOnLoad) {
        //     WindowManager.mainWindow.maximize();
        // }

        if (!config.persisted.get('version')) {
            config.persisted.set('version', app.getVersion());
            config.persisted.set('services', []);
            logger.debug('Initialised Config!');
        }

        let userServices = config.persisted.get('services') || [];
        status.services = userServices;

        services.forEach((dservice) => {
            let service = userServices.find(
                (service) => service.name == dservice.name
            );

            if (service) {
                status.services[userServices.indexOf(service)] = {
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
                status.services.push(dservice);
            }
        });

        let defaultService = config.persisted.get('options.defaultService'),
            lastOpenedPage = config.persisted.get('options.lastOpenedPage'),
            relaunchToPage = config.persisted.get('relaunch.toPage');

        if (process.env.WEBPACK_DEV_SERVER_URL) {
            // Load the url of the dev server if in development mode
            this.mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
            // if (!process.env.IS_TEST) win.webContents.openDevTools();
        } else {
            createProtocol('app');
            // Load the index.html when not in development
            this.mainWindow.loadURL('app://./index.html');
        }

        this.mainWindow.on('focus', () => {
            let sendEventName = 'main-window-focus';
            logger.debug('Sending focus event: ' + sendEventName);
            // WindowManager.mainWindow.webContents.send(sendEventName, 'ping');
        });

        this.mainWindow.webContents.on('did-finish-load', () => {
            logger.debug('did-finish-load');
            if (showOnLoad) {
                this.mainWindow.show();
                // this.mainWindow.focus();
            }
        });

        this.mainWindow.on('resized', () => {
            if (status.resizing) {
                status.resizing = false;
            } else if (WindowUtils.isSidedockMode()) {
                status.orgBounds = Object.assign(
                    {},
                    this.mainWindow.getBounds()
                );
            }
        });

        this.mainWindow.on('close', () => {
            if (this.mainWindow) {
                let bounds = {};

                if (WindowUtils.isSidedockMode()) {
                    bounds = status.orgBounds;
                } else {
                    bounds.x = this.mainWindow.getPosition()[0];
                    bounds.y = this.mainWindow.getPosition()[1];
                    bounds.width = this.mainWindow.getSize()[0];
                    bounds.height = this.mainWindow.getSize()[1];
                }

                config.persisted.set('options.windowSize', bounds);
            }
            // if (app.dock) {
            //     logger.debug('Hide dock window.');
            //     app.dock.hide();
            // }
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
            logger.debug('Main window closed');
        });

        this.initMenus();
    }

    static openMainWindow() {
        if (!this.mainWindow) {
            this.setMainWindow();
        }

        if (this.mainWindow.isMinimized()) {
            this.mainWindow.restore();
        }

        this.mainWindow.show();
        logger.debug('Focusing main window');
        this.mainWindow.focus();
    }

    static initMainWindowEvents() {
        logger.debug('Init main window events.');

        ipcMain.on('toggle-main-window', (ev, name) => {
            if (!this.mainWindow) {
                logger.debug('MainWindow closed, opening');
                this.setMainWindow();
            }

            logger.debug('Toggling main window');

            if (this.mainWindow.isVisible() && !this.mainWindow.isMinimized()) {
                logger.debug('Hide main window');
                this.mainWindow.hide();
            } else if (WindowManager.mainWindow.isMinimized()) {
                logger.debug('Restore main window');
                this.mainWindow.restore();
            } else {
                logger.debug('Show main window');
                thWindowManageris.mainWindow.show();
            }
        });
    }

    static storeWindowSize() {
        try {
            config.persisted.set('windowSize', this.mainWindow.getBounds());
        } catch (e) {
            logger.error('Error saving', e);
        }
    }

    static setTrayWindow() {
        logger.debug('Creating tray window.');

        this.tray = new Tray(config.iconTray);
        this.tray.setToolTip('Video');

        const contextMenu = getTrayMenu(status.services);
        this.tray.setContextMenu(contextMenu);
    }

    // static setTrayIconToUpdate() {
    //     let iconUpdate =
    //         os.platform() === 'darwin'
    //             ? config.iconUpdate
    //             : config.iconUpdateBig;
    //     this.menubar.tray.setImage(iconUpdate);

    //     this.menubar.tray.on('click', async () => {
    //         const { response } = await dialog.showMessageBox(
    //             this.menubar.window,
    //             {
    //                 type: 'question',
    //                 buttons: ['Update', 'Cancel'],
    //                 defaultId: 0,
    //                 message: `New version is downloaded, do you want to install it now?`,
    //                 title: 'Update available',
    //             }
    //         );

    //         if (response === 0) {
    //             autoUpdater.quitAndInstall();
    //         }
    //     });
    // }
}
