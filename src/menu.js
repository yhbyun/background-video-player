import { Menu, dialog } from 'electron';
import prompt from 'electron-prompt';

let trayMenu = null;

function getServiceMenuItems(store, services, win) {
    let servicesMenuItems = [];
    let defaultServiceMenuItems = [];
    let enabledServicesMenuItems = [];

    if (services !== undefined) {
        // Menu with all services that can be clicked for easy switching
        servicesMenuItems = services.map((service) => ({
            label: service.name,
            visible: !service.hidden,
            click() {
                console.log('Changing URL To: ' + service.url);
                win.loadURL(service.url);
                win.send('run-loader', service);
            },
        }));

        // Menu for selecting default service (one which is opened on starting the app)
        defaultServiceMenuItems = services.map((service) => ({
            label: service.name,
            type: 'checkbox',
            checked: store.get('options.defaultService')
                ? store.get('options.defaultService') == service.name
                : false,
            click(e) {
                e.menu.items.forEach((e) => {
                    if (!(e.label === service.name)) e.checked = false;
                });
                store.set('options.defaultService', service.name);
            },
        }));

        // Menu with all services that can be clicked for easy switching
        enabledServicesMenuItems = services.map((service) => ({
            label: service.name,
            type: 'checkbox',
            checked: !service.hidden,
            click() {
                if (service._defaultService) {
                    let currServices = store.get('services');
                    currServices.push({
                        name: service.name,
                        hidden: !service.hidden,
                    });
                    services = currServices;
                    store.set('services', currServices);
                } else {
                    let currServices = store.get('services');
                    let currService = currServices.find(
                        (s) => service.name == s.name
                    );
                    currService.hidden = service.hidden ? undefined : true;
                    services = currServices;
                    store.set('services', currServices);
                }
            },
        }));
    }

    return {
        servicesMenuItems,
        defaultServiceMenuItems,
        enabledServicesMenuItems,
    };
}

function getSettingsMenuItems(store, services, win) {
    const opacity = store.get('options.opacity', 0.3);
    const transparentMode = store.get('options.transparent_mode', 'always');

    const { defaultServiceMenuItems, enabledServicesMenuItems } =
        getServiceMenuItems(store, services, win);

    return [
        {
            label: 'Transparency',
            submenu: [
                {
                    label: 'Enabled',
                    id: 'transparency',
                    type: 'checkbox',
                    accelerator:
                        process.platform === 'darwin'
                            ? 'Command+Ctrl+Shift+O'
                            : 'Ctrl+T',
                    checked: store.get('options.transparency', true),
                    click(e) {
                        store.set('options.transparency', e.checked);
                        e.checked ? win.setOpacity(opacity) : win.setOpacity(1);

                        setCheckboxMenuChecked('transparency', e.checked);
                        if (!e.checked)
                            setCheckboxMenuChecked('background-play', false);
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
                                setOpacity(win, store, item, 0.1);
                            },
                        },
                        {
                            label: '20%',
                            type: 'radio',
                            checked: opacity === 0.2,
                            click(item) {
                                setOpacity(win, store, item, 0.2);
                            },
                        },
                        {
                            label: '30%',
                            type: 'radio',
                            checked: opacity === 0.3,
                            click(item) {
                                setOpacity(win, store, item, 0.3);
                            },
                        },
                        {
                            label: '40%',
                            type: 'radio',
                            checked: opacity === 0.4,
                            click(item) {
                                setOpacity(win, store, item, 0.4);
                            },
                        },
                        {
                            label: '50%',
                            type: 'radio',
                            checked: opacity === 0.5,
                            click(item) {
                                setOpacity(win, store, item, 0.5);
                            },
                        },
                        {
                            label: '60%',
                            type: 'radio',
                            checked: opacity === 0.6,
                            click(item) {
                                setOpacity(win, store, item, 0.6);
                            },
                        },
                        {
                            label: '70%',
                            type: 'radio',
                            checked: opacity === 0.7,
                            click(item) {
                                setOpacity(win, store, item, 0.7);
                            },
                        },
                        {
                            label: '80%',
                            type: 'radio',
                            checked: opacity === 0.8,
                            click(item) {
                                setOpacity(win, store, item, 0.8);
                            },
                        },
                        {
                            label: '90%',
                            type: 'radio',
                            checked: opacity === 0.9,
                            click(item) {
                                setOpacity(win, store, item, 0.9);
                            },
                        },
                        {
                            label: '100%',
                            type: 'radio',
                            checked: opacity === 1,
                            click(item) {
                                setOpacity(win, store, item, 1);
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
                        store.set('options.transparent_mode', 'mouse_over');
                        if (store.get('options.transparency')) {
                            win.setOpacity(store.get('options.opacity', 0.3));
                        }
                    },
                },
                {
                    label: 'Mouse Over',
                    type: 'radio',
                    checked: transparentMode === 'mouse_over',
                    click(item) {
                        item.checked = true;
                        store.set('options.transparent_mode', 'mouse_over');
                        win.setOpacity(1);
                    },
                },
                {
                    label: 'Mouse Out',
                    type: 'radio',
                    checked: transparentMode === 'mouse_out',
                    click(item) {
                        item.checked = true;
                        store.set('options.transparent_mode', 'mouse_out');
                        if (store.get('options.transparency')) {
                            win.setOpacity(store.get('options.opacity', 0.3));
                        }
                    },
                },
            ],
        },
        {
            label: 'Always on top',
            id: 'alwaysontop',
            type: 'checkbox',
            accelerator:
                process.platform === 'darwin'
                    ? 'Command+Ctrl+Shift+A'
                    : 'Ctrl+A',
            checked: store.get('options.alwaysOnTop', true),
            click(e) {
                store.set('options.alwaysOnTop', e.checked);
                win.setAlwaysOnTop(e.checked);
                setCheckboxMenuChecked('alwaysontop', e.checked);
                if (!e.checked)
                    setCheckboxMenuChecked('background-play', false);
            },
        },
        {
            label: 'Disable Mouse',
            id: 'ignore-mouse-event',
            type: 'checkbox',
            accelerator:
                process.platform === 'darwin'
                    ? 'Command+Ctrl+Shift+M'
                    : 'Ctrl+M',
            checked: store.get('options.ignoreMouseEvent', true),
            click(e) {
                store.set('options.ignoreMouseEvent', e.checked);
                win.setIgnoreMouseEvents(e.checked);
                setCheckboxMenuChecked('ignore-mouse-event', e.checked);
                if (!e.checked)
                    setCheckboxMenuChecked('background-play', false);
            },
        },
        {
            label: 'Background Play',
            id: 'background-play',
            type: 'checkbox',
            accelerator:
                process.platform === 'darwin'
                    ? 'Command+Ctrl+Shift+B'
                    : 'Ctrl+B',
            checked:
                store.get('options.transparency', true) &&
                store.get('options.alwaysOnTop', true) &&
                store.get('options.ignoreMouseEvent', true),
            click(e) {
                store.set('options.transparency', e.checked);
                e.checked ? win.setOpacity(opacity) : win.setOpacity(1);
                setCheckboxMenuChecked('transparency', e.checked);

                store.set('options.alwaysOnTop', e.checked);
                win.setAlwaysOnTop(e.checked);
                setCheckboxMenuChecked('alwaysontop', e.checked);

                store.set('options.ignoreMouseEvent', e.checked);
                win.setIgnoreMouseEvents(e.checked);
                setCheckboxMenuChecked('ignore-mouse-event', e.checked);

                setCheckboxMenuChecked('background-play', e.checked);
            },
        },
        {
            label: 'Loop',
            id: 'loop',
            type: 'checkbox',
            accelerator:
                process.platform === 'darwin'
                    ? 'Command+Ctrl+Shift+L'
                    : 'Ctrl+L',
            checked: store.get('options.loop', false),
            click(e) {
                store.set('options.loop', e.checked);
                setCheckboxMenuChecked('loop', e.checked);
            },
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
                        store.delete('options.defaultService');
                    },
                    checked: store.get('options.defaultService') === undefined,
                },
                {
                    label: 'Last Opened Page',
                    type: 'checkbox',
                    click(e) {
                        e.menu.items.forEach((e) => {
                            if (!(e.label === 'Last Opened Page'))
                                e.checked = false;
                        });
                        store.set('options.defaultService', 'lastOpenedPage');
                    },
                    checked:
                        store.get('options.defaultService') ===
                        'lastOpenedPage',
                },
                { type: 'separator' },
            ].concat(defaultServiceMenuItems),
        },
    ];
}

function setCheckboxMenuChecked(menuId, checked) {
    Menu.getApplicationMenu().getMenuItemById(menuId).checked = checked;
    trayMenu.getMenuItemById(menuId).checked = checked;
}

export function getTrayMenu(store, services, win) {
    const { servicesMenuItems } = getServiceMenuItems(store, services, win);

    trayMenu = Menu.buildFromTemplate(
        [
            {
                label: 'Open File',
                click() {
                    openFile(win);
                },
            },
            {
                label: 'Load Video',
                click() {
                    loadVideoUrl(win);
                },
            },
            {
                label: 'Load Page',
                click() {
                    loadPageUrl(win);
                },
            },
            { type: 'separator' },
            { label: 'Services', submenu: servicesMenuItems },
            { type: 'separator' },
            {
                label: 'Play',
                click() {
                    win.send('play-control', 'play');
                },
            },
            {
                label: 'Pause',
                click() {
                    win.send('play-control', 'pause');
                },
            },
            { type: 'separator' },
        ]
            .concat(getSettingsMenuItems(store, services, win))
            .concat([{ type: 'separator' }, { role: 'quit' }])
    );

    return trayMenu;
}

export function getApplicationMenu(store, services, win, app) {
    const { servicesMenuItems } = getServiceMenuItems(store, services, win);

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
            label: 'Services',
            submenu: servicesMenuItems.concat([
                {
                    label: 'Custom Url',
                    accelerator: 'CmdOrCtrl+O',
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
                            win
                        )
                            .then((inputtedURL) => {
                                if (inputtedURL != null) {
                                    if (inputtedURL == '') {
                                        inputtedURL = 'http://example.org';
                                    }

                                    console.log(
                                        'Opening Custom URL: ' + inputtedURL
                                    );
                                    win.loadURL(inputtedURL);
                                }
                            })
                            .catch(console.error);
                    },
                },
            ]),
        },
        {
            label: 'Settings',
            submenu: getSettingsMenuItems(store, services, win),
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
}

function openFile(win) {
    win.focus();

    dialog
        .showOpenDialog(win, {
            properties: ['openFile'],
            // filters: [
            //     {name: 'Movies', extensions: ['mkv', 'avi', 'mp4', 'rmvb', 'flv', 'ogv','webm', '3gp', 'mov']},
            // ]
        })
        .then((result) => {
            let canceled = result.canceled;
            let filePaths = result.filePaths;
            if (!canceled && win && filePaths.length > 0) {
                win.send('openFile', filePaths[0]);
            }
        });
}

function loadVideoUrl(win) {
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
        win
    )
        .then((r) => {
            if (r) {
                let playParams = {};
                playParams.type = isYoutubeUrl(r) ? 'youtube' : 'native';
                playParams.videoSource = r;
                win.send('fileSelected', playParams);
            }
        })
        .catch(console.error);
}

function loadPageUrl(win) {
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
        win
    )
        .then((r) => {
            if (r) {
                console.log('Changing URL To: ' + r);
                win.loadURL(r);
            }
        })
        .catch(console.error);
}

function isYoutubeUrl(url) {
    const regExp =
        /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    return !!url.match(regExp);
}

function setOpacity(win, store, item, opacity) {
    item.checked = true;
    store.set('options.opacity', opacity);
    win.setOpacity(opacity);
}
