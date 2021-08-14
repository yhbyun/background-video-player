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

        status.resizing = true;
        status.inZoom = false;
        WindowManager.mainWindow.setBounds({ x: 0, width: 30 }, true);
        WindowUtils.setWindowOpacity(false);
    }

    static deactivateSidedock() {
        status.resizing = true;
        status.inZoom = true;
        WindowManager.mainWindow.setBounds(status.orgBounds, true);
        WindowUtils.setWindowOpacity(false);
    }

    static handleMouseEnterOnSidedock() {
        if (status.resizing || status.inZoom) return;

        status.resizing = true;
        status.inZoom = true;
        WindowManager.mainWindow.setBounds(
            {
                width: status.orgBounds.width,
            },
            true
        );
        WindowUtils.setWindowOpacity(true);
    }

    static handleMouseLeaveOnSidedock() {
        if (status.resizing || !status.inZoom) return;

        if (WindowUtils.isMouseOverWindow()) {
            logger.debug("Ignore mouseleave. It's wrong.");
            return;
        }

        status.resizing = true;
        status.inZoom = false;
        WindowManager.mainWindow.setBounds({ width: 30 }, true);
        WindowUtils.setWindowOpacity(false);
    }
}
