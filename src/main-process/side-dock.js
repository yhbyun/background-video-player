import { screen } from 'electron';
import WindowManager from './window-manager';
import WindowUtils from './window-utils';
import { logManager } from './log-manager';
import status from './status';

let logger = logManager.getLogger('SideDock');

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

        if (WindowUtils.isWindowLeftOrRight() === 'left') {
            WindowManager.mainWindow.setBounds({ x: 0, width: 30 }, true);
        } else {
            const { width } = screen.getPrimaryDisplay().workAreaSize;
            WindowManager.mainWindow.setBounds(
                { x: width - 30, width: 30 },
                true
            );
        }

        WindowUtils.setWindowOpacity(false);
    }

    static _pullDockedWindow() {
        status.resizing = true;
        status.inZoom = true;

        if (WindowUtils.isWindowLeftOrRight() === 'left') {
            WindowManager.mainWindow.setBounds(
                { width: status.orgBounds.width },
                true
            );
        } else {
            const { width } = screen.getPrimaryDisplay().workAreaSize;
            WindowManager.mainWindow.setBounds(
                {
                    x: width - status.orgBounds.width,
                    width: status.orgBounds.width,
                },
                true
            );
        }

        WindowUtils.setWindowOpacity(true);
    }
}
