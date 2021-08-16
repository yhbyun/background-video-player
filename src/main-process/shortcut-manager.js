import { globalShortcut } from 'electron';
import config from './config';
import { logManager } from './log-manager';

let logger = logManager.getLogger('ShortcutManager');

export const registerShortcuts = () => {
    Object.keys(config.shortcuts).forEach((key) => {
        const shortcut = config.shortcuts[key];
        const ret = globalShortcut.register(shortcut.combo, shortcut.action);
        if (ret) {
            logger.debug(
                `${key} : ${shortcut.combo} global shortcut registered`
            );
        } else {
            logger.error(`${key} global shortcut registration failed`);
        }
    });
};

export const unregisterAll = () => globalShortcut.unregisterAll();
