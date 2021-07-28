import { Menu, Tray, nativeImage, dialog } from "electron";
import prompt from 'electron-prompt';

let tray = null ;

export function createTray(store, services, win) {
    tray = new Tray(nativeImage.createEmpty())
    tray.setTitle('Video')
    tray.setToolTip('Video')

    let servicesMenuItems = [];
    let defaultServiceMenuItems = [];
    let enabledServicesMenuItems = [];
    const opacity = store.get('options.opacity', 0.3);

    if (services !== undefined) {
        // Menu with all services that can be clicked for easy switching
        servicesMenuItems = services.map(service => ({
            label: service.name,
            visible: !service.hidden,
            click() {
                console.log('Changing URL To: ' + service.url);
                win.loadURL(service.url);
            }
        }));

        // Menu for selecting default service (one which is opened on starting the app)
        defaultServiceMenuItems = services.map(service => ({
            label: service.name,
            type: 'checkbox',
            checked: store.get('options.defaultService')
                ? store.get('options.defaultService') == service.name
                : false,
            click(e) {
                e.menu.items.forEach(e => {
                    if (!(e.label === service.name)) e.checked = false;
                });
                store.set('options.defaultService', service.name);
            }
        }));

        // Menu with all services that can be clicked for easy switching
        enabledServicesMenuItems = services.map(service => ({
            label: service.name,
            type: 'checkbox',
            checked: !service.hidden,
            click() {
                if (service._defaultService) {
                    let currServices = store.get('services');
                    currServices.push({
                        name: service.name,
                        hidden: !service.hidden
                    });
                    services = currServices;
                    store.set('services', currServices);
                } else {
                    let currServices = store.get('services');
                    let currService = currServices.find(s => service.name == s.name);
                    currService.hidden = service.hidden ? undefined : true
                    services = currServices;
                    store.set('services', currServices);
                }
            }
        }));
    }

    let contextMenu = Menu.buildFromTemplate([
        { label: 'Open File', click() { openFile(win) } },
        { label: 'Load URL', click() { loadUrl(win) } },
        { label: 'Services', submenu: servicesMenuItems },
        { label: 'Enabled Services', submenu: enabledServicesMenuItems },
        { label: 'Default Service',
            submenu: [
                {
                    label: 'Menu',
                    type: 'checkbox',
                    click(e) {
                        e.menu.items.forEach(e => {
                            if (!(e.label === 'Menu')) e.checked = false;
                        });
                        store.delete('options.defaultService');
                    },
                    checked: store.get('options.defaultService') === undefined
                },
                {
                    label: 'Last Opened Page',
                    type: 'checkbox',
                    click(e) {
                        e.menu.items.forEach(e => {
                            if (!(e.label === 'Last Opened Page')) e.checked = false;
                        });
                        store.set('options.defaultService', 'lastOpenedPage');
                    },
                    checked: store.get('options.defaultService') === 'lastOpenedPage'
                },
                { type: 'separator' }
            ].concat(defaultServiceMenuItems)
        },
        { label: 'Play', click() { win.send('play-control', 'play') } },
        { label: 'Pause', click() { win.send('play-control', 'pause') } },
        { type: 'separator' },
        { label: 'Transparency',
            submenu: [
                {
                    label: 'Enabled',
                    id: 'transparency',
                    type: 'checkbox',
                    accelerator: process.platform === 'darwin' ? 'Command+Ctrl+Shift+O' : 'Ctrl+T',
                    checked: store.get('options.transparency', true),
                    click(e) {
                        store.set('options.transparency', e.checked);
                        e.checked ? win.setOpacity(opacity) : win.setOpacity(1);
                    },
                },
                { label: 'Opacity',
                    submenu: [
                        { label: '10%', type: 'radio', checked: opacity === 0.1, click(item) { setOpacity(win, store, item, 0.1) } },
                        { label: '20%', type: 'radio', checked: opacity === 0.2, click(item) { setOpacity(win, store, item, 0.2) } },
                        { label: '30%', type: 'radio', checked: opacity === 0.3, click(item) { setOpacity(win, store, item, 0.3) } },
                        { label: '40%', type: 'radio', checked: opacity === 0.4, click(item) { setOpacity(win, store, item, 0.4) } },
                        { label: '50%', type: 'radio', checked: opacity === 0.5, click(item) { setOpacity(win, store, item, 0.5) } },
                        { label: '60%', type: 'radio', checked: opacity === 0.6 , click(item) { setOpacity(win, store, item, 0.6) } },
                        { label: '70%', type: 'radio', checked: opacity === 0.7, click(item) { setOpacity(win, store, item, 0.7) } },
                        { label: '80%', type: 'radio', checked: opacity === 0.8, click(item) { setOpacity(win, store, item, 0.8) } },
                        { label: '90%', type: 'radio', checked: opacity === 0.9, click(item) { setOpacity(win, store, item, 0.9) } },
                        { label: '100%', type: 'radio', checked: opacity === 1, click(item) { setOpacity(win, store, item, 1) } },
                    ],
                },
            ]
        },
        {
            label: 'Always on top',
            id: 'alwaysontop',
            type: 'checkbox',
            accelerator: process.platform === 'darwin' ? 'Command+Ctrl+Shift+A' : 'Ctrl+A',
            checked: store.get('options.alwaysOnTop', true),
            click(e) {
                store.set('options.alwaysOnTop', e.checked);
                win.setAlwaysOnTop(e.checked);
            },
        },
        {
            label: 'Disable Mouse',
            id: 'ignore-mouse-event',
            type: 'checkbox',
            accelerator: process.platform === 'darwin' ? 'Command+Ctrl+Shift+M' : 'Ctrl+A',
            checked: store.get('options.ignoreMouseEvent', true),
            click(e) {
                store.set('options.ignoreMouseEvent', e.checked);
                win.setIgnoreMouseEvents(e.checked);
            },
        },
        { type: 'separator' },
        { role: 'quit' },
    ]);

    tray.setContextMenu(contextMenu)
};

function openFile(win) {
    win.focus();

    dialog.showOpenDialog(win, {
        properties: ['openFile'],
        // filters: [
        //     {name: 'Movies', extensions: ['mkv', 'avi', 'mp4', 'rmvb', 'flv', 'ogv','webm', '3gp', 'mov']},
        // ]
    }).then((result) => {
        let canceled = result.canceled;
        let filePaths = result.filePaths;
        if (!canceled && win && filePaths.length > 0) {
            win.send('openFile', filePaths[0]);
        }
    });
}

function loadUrl(win) {
    prompt({
        title: 'Video URL',
        label: 'URL:',
        value: 'https://example.org',
        inputAttrs: {
            type: 'url'
        },
        type: 'input',
        alwaysOnTop: true
    })
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

function isYoutubeUrl(url) {
    const regExp = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    return !!url.match(regExp);
}

function setOpacity(win, store, item, opacity) {
    item.checked = true
    store.set('options.opacity', opacity);
    win.setOpacity(opacity)
}
