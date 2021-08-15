import { screen } from 'electron';
import WindowManager from './window-manager';
import WindowUtils from './window-utils';
import { logManager } from './log-manager';
import status from './status';
import { ElectronTWEEN } from 'electron-tween';

let logger = logManager.getLogger('SideDock');
const sidedockWidth = 20;

export default class SideDock {
    static activateSidedock() {
        status.orgBounds = Object.assign(
            {},
            WindowManager.mainWindow.getBounds()
        );

        SideDock._setWindowDocked();
    }

    static deactivateSidedock() {
        status.resizing = true;
        status.inZoom = true;
        WindowManager.mainWindow.setBounds(status.orgBounds, true);
        WindowUtils.setWindowOpacity(false);
    }

    static handleMouseEnterOnSidedock() {
        if (status.resizing || status.inZoom) return;

        SideDock._pullDockedWindow();
    }

    static handleMouseLeaveOnSidedock() {
        if (status.resizing || !status.inZoom) return;

        if (WindowUtils.isMouseOverWindow()) {
            logger.debug("Ignore mouseleave. It's wrong.");
            return;
        }

        SideDock._setWindowDocked();
    }

    static _setWindowDocked() {
        status.resizing = true;
        status.inZoom = false;

        const bounds = WindowManager.mainWindow.getBounds();
        let to;

        if (WindowUtils.isWindowLeftOrRight() === 'left') {
            to = {
                x: sidedockWidth - bounds.width,
                y: bounds.y,
            };
        } else {
            const { width } = screen.getPrimaryDisplay().workAreaSize;

            to = {
                x: width - sidedockWidth,
                y: bounds.y,
            };
        }

        ElectronTWEEN.Move({
            win: WindowManager.mainWindow,
            to: to,
            time: 200,
            easing: 'BOUNCE_OUT',
            start: true,
            onComplete: () => {
                status.resizing = false;
            },
        });

        WindowUtils.setWindowOpacity(false);
    }

    static _pullDockedWindow() {
        status.resizing = true;
        status.inZoom = true;

        const bounds = WindowManager.mainWindow.getBounds();
        let to;

        if (WindowUtils.isWindowLeftOrRight() === 'left') {
            to = {
                x: 0,
                y: bounds.y,
            };
        } else {
            const { width } = screen.getPrimaryDisplay().workAreaSize;
            to = {
                x: width - bounds.width,
                y: bounds.y,
            };
        }

        ElectronTWEEN.Move({
            win: WindowManager.mainWindow,
            to: to,
            time: 200,
            easing: 'BOUNCE_OUT',
            start: true,
            onComplete: () => {
                status.resizing = false;
            },
        });

        WindowUtils.setWindowOpacity(true);
    }
}
