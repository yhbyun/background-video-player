import Store from 'electron-store';
import * as path from 'path';
import * as os from 'os';

const isDevelopment = process.env.NODE_ENV !== 'production';
const isTest = process.env.IS_TEST;
const isWin = os.platform() === 'win32';

const persisted = new Store();

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

    isDev: isDevelopment,
    isWin: isWin,
    isTest: isTest,
};
