import Store from 'electron-store';
import * as path from 'path';
import * as os from 'os';
import {
    toggleTransparency,
    toggleAlwaysOnTop,
    toggleIgnoreMouse,
    toggleSidedock,
} from './menu-builder';

const isDevelopment = process.env.NODE_ENV !== 'production';
const isTest = process.env.IS_TEST;
const isWin = os.platform() === 'win32';

const schema = {
    transparency: {
        type: 'boolean',
        default: false,
    },
    opacity: {
        type: 'number',
        default: 0.3,
    },
    alwaysOnTop: {
        type: 'boolean',
        default: true,
    },
    ignoreMouseEvent: {
        type: 'boolean',
        default: false,
    },
    sidedock: {
        type: 'boolean',
        default: false,
    },
    loop: {
        type: 'boolean',
        default: false,
    },
};

const persisted = new Store(schema);

// reset some options
persisted.set('options.sidedock', false);

let root = path.join(__dirname, '..');

export const getIcon = (winFileName, macFileName) => {
    return path.join(__static, isWin ? `${winFileName}` : `${macFileName}`);
};

export const getTrayIcon = () => {
    return getIcon('icon@32.png', 'icon@32.png');
};

export default {
    root: root,
    persisted: persisted,

    iconTray: getTrayIcon(),
    iconWindow: getIcon('icon.icns', 'icon.icns'),

    shortcuts: {
        toggleTransparency: {
            combo: 'Cmd+Ctrl+Shift+O',
            action: () => toggleTransparency(),
        },
        toggleAlwaysOnTop: {
            combo: 'Cmd+Ctrl+Shift+A',
            action: () => toggleAlwaysOnTop(),
        },
        toggleIgnoreMouse: {
            combo: 'Cmd+Ctrl+Shift+M',
            action: () => toggleIgnoreMouse(),
        },
        toggleSidedock: {
            combo: 'Cmd+Ctrl+Shift+S',
            action: () => toggleSidedock(),
        },
    },

    isDev: isDevelopment,
    isWin: isWin,
    isTest: isTest,
};
