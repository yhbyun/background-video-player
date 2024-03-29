import { app, Menu, dialog } from 'electron';
import prompt from 'electron-prompt';
import config from './config';
import status from './status';
import { logManager } from './log-manager';
import WindowManager, { sendToMainWindow } from './window-manager';
import WindowUtils from './window-utils';
import Utils from '../common/utils';

const macOS = process.platform === 'darwin';
let logger = logManager.getLogger('MenuBuilder');

let trayMenu = null;

export const NETFLIX_LLN_EXT = 'Language Learning with Netflix';
export const NETFLIX_NFL_EXT = 'NflxMultiSubs (Netflix Multi. Subtitles)';

export const toggleIgnoreMouse = () => {
    logger.debug('toggleIgnoreMouse is called');
    const enabled = !config.persisted.get('options.ignoreMouseEvent');

    config.persisted.set('options.ignoreMouseEvent', enabled);
    WindowManager.mainWindow.setIgnoreMouseEvents(enabled);
    setCheckboxMenuChecked('ignore-mouse-event', enabled);
    if (!enabled) setCheckboxMenuChecked('background-play', false);
};

export const toggleTransparency = () => {
    logger.debug('toggleTransparency is called');
    const enabled = !config.persisted.get('options.transparency');
    const opacity = config.persisted.get('options.opacity');

    config.persisted.set('options.transparency', enabled);
    enabled
        ? WindowManager.mainWindow.setOpacity(opacity)
        : WindowManager.mainWindow.setOpacity(1);

    setCheckboxMenuChecked('transparency', enabled);
    if (!enabled) setCheckboxMenuChecked('background-play', false);
};

/**
 * Show or hide window temporarily.
 * cyclt : show -> transparent -> hide -> show ...
 */
export const toggleOpacity = () => {
    logger.debug('toggleOpacity is called');
    const opacity = WindowManager.mainWindow.getOpacity();
    let newOpacity;

    switch (opacity) {
        case 1:
            newOpacity = config.persisted.get('options.opacity');
            break;

        case 0:
            newOpacity = 1;
            break;

        default:
            newOpacity = 0;
            break;
    }

    WindowManager.mainWindow.setOpacity(newOpacity);
};

export const toggleAlwaysOnTop = () => {
    logger.debug('toggleAlwaysOnTop is called');
    const enabled = !config.persisted.get('options.alwaysOnTop');

    config.persisted.set('options.alwaysOnTop', enabled);
    WindowManager.mainWindow.setAlwaysOnTop(enabled);
    setCheckboxMenuChecked('alwaysontop', enabled);
    if (!enabled) setCheckboxMenuChecked('background-play');
};

export const toggleSidedock = () => {
    logger.debug('toggleSidedock is called');
    const enabled = !config.persisted.get('options.sidedock');

    setCheckboxMenuChecked('sidedock', enabled);
    config.persisted.set('options.sidedock', enabled);
    sendToMainWindow('toggleSidedock', enabled);
};

export const forceFocus = () => {
    logger.debug('forceFocus is called');
    WindowManager.mainWindow.focus();
    app.focus({ steal: true });
};

const setCheckboxMenuChecked = (menuId, checked) => {
    Menu.getApplicationMenu().getMenuItemById(menuId).checked = checked;
    trayMenu.getMenuItemById(menuId).checked = checked;
};

const getServiceMenuItems = (services) => {
    let servicesMenuItems = [];
    let defaultServiceMenuItems = [];
    let enabledServicesMenuItems = [];

    if (services !== undefined) {
        // Menu with all services that can be clicked for easy switching
        servicesMenuItems = services.map((service) => ({
            label: service.name,
            visible: !service.hidden,
            click() {
                sendToMainWindow('changeMode', {
                    name: 'browser',
                    service: service,
                });

                sendToMainWindow('run-loader', service);
            },
        }));

        // Menu for selecting default service (one which is opened on starting the app)
        defaultServiceMenuItems = services.map((service) => ({
            label: service.name,
            type: 'checkbox',
            checked: config.persisted.get('options.defaultService')
                ? config.persisted.get('options.defaultService') ===
                  service.name
                : false,
            click(e) {
                e.menu.items.forEach((e) => {
                    if (!(e.label === service.name)) e.checked = false;
                });
                config.persisted.set('options.defaultService', service.name);
            },
        }));

        // Menu with all services that can be clicked for easy switching
        enabledServicesMenuItems = services.map((service) => ({
            label: service.name,
            type: 'checkbox',
            checked: !service.hidden,
            click() {
                if (service._defaultService) {
                    let currServices = config.persisted.get('services');
                    currServices.push({
                        name: service.name,
                        hidden: !service.hidden,
                    });
                    services = currServices;
                    config.persisted.set('services', currServices);
                } else {
                    let currServices = config.persisted.get('services');
                    let currService = currServices.find(
                        (s) => service.name == s.name
                    );
                    currService.hidden = service.hidden ? undefined : true;
                    services = currServices;
                    config.persisted.set('services', currServices);
                }
            },
        }));
    }

    return {
        servicesMenuItems,
        defaultServiceMenuItems,
        enabledServicesMenuItems,
    };
};

const getSettingsMenuItems = (services) => {
    const opacity = config.persisted.get('options.opacity');
    const transparentMode = config.persisted.get(
        'options.transparent_mode',
        'always'
    );

    const { defaultServiceMenuItems, enabledServicesMenuItems } =
        getServiceMenuItems(services);

    const setOpacity = (item, opacity) => {
        item.checked = true;
        config.persisted.set('options.opacity', opacity);
        WindowManager.mainWindow.setOpacity(opacity);
    };

    return [
        {
            label: 'Transparency',
            submenu: [
                {
                    label: 'Enabled',
                    id: 'transparency',
                    type: 'checkbox',
                    accelerator: macOS ? 'Cmd+Ctrl+Shift+O' : 'Ctrl+T',
                    checked: config.persisted.get('options.transparency'),
                    click(e) {
                        toggleTransparency();
                    },
                },
                {
                    label: 'Opacity',
                    submenu: [
                        {
                            label: '10%',
                            type: 'radio',
                            checked: opacity === 0.1,
                            click(item) {
                                setOpacity(item, 0.1);
                            },
                        },
                        {
                            label: '20%',
                            type: 'radio',
                            checked: opacity === 0.2,
                            click(item) {
                                setOpacity(item, 0.2);
                            },
                        },
                        {
                            label: '30%',
                            type: 'radio',
                            checked: opacity === 0.3,
                            click(item) {
                                setOpacity(item, 0.3);
                            },
                        },
                        {
                            label: '40%',
                            type: 'radio',
                            checked: opacity === 0.4,
                            click(item) {
                                setOpacity(item, 0.4);
                            },
                        },
                        {
                            label: '50%',
                            type: 'radio',
                            checked: opacity === 0.5,
                            click(item) {
                                setOpacity(item, 0.5);
                            },
                        },
                        {
                            label: '60%',
                            type: 'radio',
                            checked: opacity === 0.6,
                            click(item) {
                                setOpacity(item, 0.6);
                            },
                        },
                        {
                            label: '70%',
                            type: 'radio',
                            checked: opacity === 0.7,
                            click(item) {
                                setOpacity(item, 0.7);
                            },
                        },
                        {
                            label: '80%',
                            type: 'radio',
                            checked: opacity === 0.8,
                            click(item) {
                                setOpacity(item, 0.8);
                            },
                        },
                        {
                            label: '90%',
                            type: 'radio',
                            checked: opacity === 0.9,
                            click(item) {
                                setOpacity(item, 0.9);
                            },
                        },
                        {
                            label: '100%',
                            type: 'radio',
                            checked: opacity === 1,
                            click(item) {
                                setOpacity(item, 1);
                            },
                        },
                    ],
                },
                { type: 'separator' },
                {
                    label: 'Always',
                    type: 'radio',
                    checked: transparentMode === 'always',
                    click(item) {
                        item.checked = true;
                        config.persisted.set(
                            'options.transparent_mode',
                            'always'
                        );
                        if (config.persisted.get('options.transparency')) {
                            WindowManager.mainWindow.setOpacity(
                                config.persisted.get('options.opacity')
                            );
                        }
                    },
                },
                {
                    label: 'Mouse Over',
                    type: 'radio',
                    checked: transparentMode === 'mouse_over',
                    click(item) {
                        item.checked = true;
                        config.persisted.set(
                            'options.transparent_mode',
                            'mouse_over'
                        );
                        WindowManager.mainWindow.setOpacity(1);
                    },
                },
                {
                    label: 'Mouse Out',
                    type: 'radio',
                    checked: transparentMode === 'mouse_out',
                    click(item) {
                        item.checked = true;
                        config.persisted.set(
                            'options.transparent_mode',
                            'mouse_out'
                        );
                        if (config.persisted.get('options.transparency')) {
                            WindowManager.mainWindow.setOpacity(
                                config.persisted.get('options.opacity')
                            );
                        }
                    },
                },
            ],
        },
        {
            label: 'Always on top',
            id: 'alwaysontop',
            type: 'checkbox',
            accelerator: macOS ? 'Cmd+Ctrl+Shift+A' : 'Ctrl+A',
            checked: config.persisted.get('options.alwaysOnTop'),
            click(e) {
                toggleAlwaysOnTop();
            },
        },
        {
            label: 'Disable Mouse',
            id: 'ignore-mouse-event',
            type: 'checkbox',
            accelerator: macOS ? 'Cmd+Ctrl+Shift+M' : 'Ctrl+M',
            checked: config.persisted.get('options.ignoreMouseEvent', true),
            click(e) {
                toggleIgnoreMouse();
            },
        },
        {
            label: 'Side Dock',
            id: 'sidedock',
            type: 'checkbox',
            accelerator: macOS ? 'Cmd+Ctrl+Shift+S' : 'Ctrl+S',
            checked: config.persisted.get('options.sidedock'),
            click(e) {
                toggleSidedock();
            },
        },
        {
            label: 'Background Play',
            id: 'background-play',
            type: 'checkbox',
            accelerator: macOS ? 'Cmd+Ctrl+Shift+B' : 'Ctrl+B',
            checked:
                config.persisted.get('options.transparency') &&
                config.persisted.get('options.alwaysOnTop') &&
                config.persisted.get('options.ignoreMouseEvent'),
            click(e) {
                config.persisted.set('options.transparency', e.checked);
                e.checked
                    ? WindowManager.mainWindow.setOpacity(opacity)
                    : WindowManager.mainWindow.setOpacity(1);
                setCheckboxMenuChecked('transparency', e.checked);

                config.persisted.set('options.alwaysOnTop', e.checked);
                WindowManager.mainWindow.setAlwaysOnTop(e.checked);
                setCheckboxMenuChecked('alwaysontop', e.checked);

                config.persisted.set('options.ignoreMouseEvent', e.checked);
                WindowManager.mainWindow.setIgnoreMouseEvents(e.checked);
                setCheckboxMenuChecked('ignore-mouse-event', e.checked);

                setCheckboxMenuChecked('background-play', e.checked);
            },
        },
        {
            label: 'Loop',
            id: 'loop',
            type: 'checkbox',
            accelerator: macOS ? 'Cmd+Ctrl+Shift+L' : 'Ctrl+L',
            checked: config.persisted.get('options.loop'),
            click(e) {
                config.persisted.set('options.loop', e.checked);
                setCheckboxMenuChecked('loop', e.checked);
            },
        },
        { type: 'separator' },
        {
            label: 'Netflix Subtile',
            submenu: [
                {
                    label: NETFLIX_LLN_EXT,
                    type: 'radio',
                    checked:
                        config.persisted.get('options.netflix_extension') ===
                        NETFLIX_LLN_EXT,
                    click(item) {
                        item.checked = true;
                        config.persisted.set(
                            'options.netflix_extension',
                            NETFLIX_LLN_EXT
                        );

                        WindowUtils.relaunch();
                    },
                },
                {
                    label: NETFLIX_NFL_EXT,
                    type: 'radio',
                    checked:
                        config.persisted.get('options.netflix_extension') ===
                        NETFLIX_NFL_EXT,
                    click(item) {
                        item.checked = true;
                        config.persisted.set(
                            'options.netflix_extension',
                            NETFLIX_NFL_EXT
                        );

                        WindowUtils.relaunch();
                    },
                },
            ],
        },
        { label: 'Enabled Services', submenu: enabledServicesMenuItems },
        {
            label: 'Default Service',
            submenu: [
                {
                    label: 'Empty Page',
                    type: 'checkbox',
                    click(e) {
                        e.menu.items.forEach((e) => {
                            if (!(e.label === 'Empty Page')) e.checked = false;
                        });
                        config.persisted.delete('options.defaultService');
                    },
                    checked:
                        config.persisted.get('options.defaultService') ===
                        undefined,
                },
                {
                    label: 'Last Opened Page',
                    type: 'checkbox',
                    click(e) {
                        e.menu.items.forEach((e) => {
                            if (!(e.label === 'Last Opened Page'))
                                e.checked = false;
                        });
                        config.persisted.set(
                            'options.defaultService',
                            'lastOpenedPage'
                        );
                    },
                    checked:
                        config.persisted.get('options.defaultService') ===
                        'lastOpenedPage',
                },
                { type: 'separator' },
            ].concat(defaultServiceMenuItems),
        },
    ];
};

const getApplicationMenu = (services) => {
    const { servicesMenuItems } = getServiceMenuItems(services);

    return Menu.buildFromTemplate([
        {
            label: 'BackgroundVideoPlayer',
            submenu: [
                {
                    label: 'BackgroundVideoPlayer (' + app.getVersion() + ')',
                    enabled: false,
                },
                { role: 'quit' },
            ],
        },
        {
            label: 'File',
            submenu: [
                {
                    label: 'Open File...',
                    accelerator: 'CmdOrCtrl+O',
                    click() {
                        openFile();
                    },
                },
                {
                    label: 'Open Location...',
                    accelerator: 'CmdOrCtrl+L',
                    click() {
                        prompt(
                            {
                                title: 'Open Custom URL',
                                label: 'URL:',
                                inputAttrs: {
                                    type: 'url',
                                    placeholder: 'http://example.org',
                                },
                            },
                            WindowManager.mainWindow
                        )
                            .then((inputtedURL) => {
                                if (inputtedURL != null) {
                                    if (inputtedURL == '') {
                                        inputtedURL = 'http://example.org';
                                    }

                                    logger.debug(
                                        'Opening Custom URL: ' + inputtedURL
                                    );
                                    WindowManager.mainWindow.loadURL(
                                        inputtedURL
                                    );
                                }
                            })
                            .catch(console.error);
                    },
                },
                {
                    label: 'Load Video',
                    click() {
                        loadVideoUrl();
                    },
                },
            ],
        },
        {
            label: 'Services',
            submenu: servicesMenuItems,
        },
        {
            label: 'Settings',
            submenu: getSettingsMenuItems(services),
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'pasteandmatchstyle' },
                { role: 'delete' },
                { role: 'selectall' },
            ],
        },
        {
            label: 'Developer',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click(item, focusedWindow) {
                        if (focusedWindow) focusedWindow.reload();
                    },
                },
                {
                    label: 'Toggle Developer Tools',
                    accelerator:
                        process.platform === 'darwin'
                            ? 'Alt+Command+I'
                            : 'Ctrl+Shift+I',
                    click(item, focusedWindow) {
                        focusedWindow.webContents.toggleDevTools();
                    },
                },
                {
                    type: 'separator',
                },
                {
                    role: 'resetzoom',
                },
                {
                    role: 'zoomin',
                },
                {
                    role: 'zoomout',
                },
                {
                    type: 'separator',
                },
                {
                    role: 'togglefullscreen',
                },
            ],
        },
    ]);
};

export const getTrayMenu = (services) => {
    const { servicesMenuItems } = getServiceMenuItems(services);

    trayMenu = Menu.buildFromTemplate(
        [
            {
                label: 'Open File',
                click() {
                    openFile();
                },
            },
            {
                label: 'Open Location',
                click() {
                    loadPageUrl();
                },
            },
            {
                label: 'Load Video',
                click() {
                    loadVideoUrl();
                },
            },
            { type: 'separator' },
            { label: 'Services', submenu: servicesMenuItems },
            { type: 'separator' },
            {
                label: 'Play',
                click() {
                    sendToMainWindow('play-control', 'play');
                },
            },
            {
                label: 'Pause',
                click() {
                    sendToMainWindow('play-control', 'pause');
                },
            },
            { type: 'separator' },
        ]
            .concat(getSettingsMenuItems(services))
            .concat([{ type: 'separator' }, { role: 'quit' }])
    );

    return trayMenu;
};

const openFile = () => {
    WindowManager.mainWindow.focus();

    dialog
        .showOpenDialog(WindowManager.mainWindow, {
            properties: ['openFile'],
            // filters: [
            //     {name: 'Movies', extensions: ['mkv', 'avi', 'mp4', 'rmvb', 'flv', 'ogv','webm', '3gp', 'mov']},
            // ]
        })
        .then((result) => {
            let canceled = result.canceled;
            let filePaths = result.filePaths;
            if (!canceled && filePaths.length > 0) {
                sendToMainWindow('openFile', filePaths[0]);
            }
        });
};

const loadVideoUrl = () => {
    prompt(
        {
            title: 'Video URL',
            label: 'Video URL:',
            value: 'https://example.org',
            inputAttrs: {
                type: 'url',
            },
            type: 'input',
        },
        WindowManager.mainWindow
    )
        .then((r) => {
            if (r) {
                let playParams = {};
                playParams.type = Utils.isYoutubeUrl(r) ? 'youtube' : 'native';
                playParams.videoSource = r;
                sendToMainWindow('fileSelected', playParams);
            }
        })
        .catch(logger.error);
};

const loadPageUrl = () => {
    prompt(
        {
            title: 'Page URL',
            label: 'URL:',
            value: 'https://example.org',
            inputAttrs: {
                type: 'url',
            },
            type: 'input',
        },
        WindowManager.mainWindow
    )
        .then((url) => {
            if (url) {
                sendToMainWindow('changeMode', {
                    name: 'browser',
                    url: url,
                });
            }
        })
        .catch(logger.error);
};

export default class MenuBuilder {
    buildMenu() {
        if (config.isDev) {
            this.setupDevelopmentEnvironment();
        }

        const menu = getApplicationMenu(status.services);
        Menu.setApplicationMenu(menu);

        return menu;
    }

    setupDevelopmentEnvironment() {
        WindowManager.mainWindow.openDevTools();

        WindowManager.mainWindow.webContents.on('context-menu', (e, props) => {
            const { x, y } = props;
            const menu = Menu.buildFromTemplate([
                {
                    label: 'Inspect element',
                    click: () => {
                        WindowManager.mainWindow.inspectElement(x, y);
                    },
                },
            ]);
            menu.popup(WindowManager.mainWindow);
        });
    }
}
