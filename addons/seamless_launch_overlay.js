// ============================================================
// Hides the wheel and clears the underlay while a table is launching, to
// avoid a jarring black screen flash between the wheel view and the table's
// own loading screen. Listens to "launchoverlayshow" and "launchoverlayhide".
// ============================================================

import { safeHandler } from "../common/core/safe_handler.js";

const SCRIPT_NAME = "SeamlessLaunchOverlay";

export default function init() {
    // Fires when the launch overlay appears: hides the wheel and replaces the
    // default overlay background (preventDefault suppresses PinballY's own).
    mainWindow.on("launchoverlayshow", safeHandler(SCRIPT_NAME, ev => {
        mainWindow.showWheel(false);
        mainWindow.setUnderlay("");
        mainWindow.launchOverlay.bg.clear(0x20FF00FF);
        ev.preventDefault();
    }));

    mainWindow.on("launchoverlayhide", safeHandler(SCRIPT_NAME, () => {
        mainWindow.showWheel(true);
    }));
}