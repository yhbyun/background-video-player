import { screen } from 'electron';
import WindowManager from './window-manager';
import config from './config';
import { logManager } from './log-manager';

let logger = logManager.getLogger('WindowUtils');

export default class WindowUtils {
    static isTransparentZoomEnabled() {
        return (
            ['mouse_over_zoom', 'mouse_out_zoom'].indexOf(
                config.persisted.get('options.transparent_mode')
            ) >= 0
        );
    }

    static setWindowOpacity(hover) {
        if (config.persisted.get('options.transparency')) {
            const opacity = config.persisted.get('options.opacity', 0.3);

            switch (config.persisted.get('options.transparent_mode')) {
                case 'mouse_over':
                case 'mouse_over_zoom':
                    hover
                        ? WindowManager.mainWindow.setOpacity(opacity)
                        : WindowManager.mainWindow.setOpacity(1);
                    break;

                case 'mouse_out':
                case 'mouse_out_zoom':
                    hover
                        ? WindowManager.mainWindow.setOpacity(1)
                        : WindowManager.mainWindow.setOpacity(opacity);
                    break;
            }
        }
    }

    static isSidedockMode() {
        return config.persisted.get('options.sidedock', false);
    }

    static isMouseOverWindow() {
        // Check that the mouse is over the window
        const { x, y } = screen.getCursorScreenPoint();
        const bounds = WindowManager.mainWindow.getBounds();

        return (
            x >= bounds.x &&
            y >= bounds.y &&
            x < bounds.x + bounds.width &&
            y < bounds.y + bounds.height
        );
    }
}
