// ============================================================
// Blocking wait: the wheel dimmed with the captioned Loader over it while a
// hidden helper works (a Pack Update getting ready, a Script Reader install).
// Handed to the wheel dialog queue as a screen over the wheel while shown.
// - Blocks every mapped button through "commandbuttondown": no table launched under it.
// - Just under the Drawn Menus, so a result Dialog submitted before hide() opens over it.
// ============================================================

import { safeHandler } from "../core/safe_handler.js";
import { DRAWN_MENU_Z_INDEX } from "../drawn_menu/drawn_menu_painter.js";
import { createLoader } from "./loader.js";
import { DIMMED_WHEEL } from "./steamball_drawing.js";

const VEIL_Z_INDEX = DRAWN_MENU_Z_INDEX.backdrop - 2;
const LOADER_Z_INDEX = DRAWN_MENU_Z_INDEX.backdrop - 1;

// dialogs: the wheel dialog queue (common/core/wheel_dialog.js); caption:
// the text under the comet.
export function createBlockingWait(host, dialogs, { scriptName, caption }) {
    const loader = createLoader(host, { zIndex: LOADER_Z_INDEX, caption });
    let veil = null;
    const closedListeners = [];

    dialogs.waitFor({
        isOpen: () => Boolean(veil),
        onClosed: listener => { closedListeners.push(listener); },
    });

    // Fires on every mapped button press.
    host.on("commandbuttondown", safeHandler(scriptName, ev => {
        if (veil) ev.preventDefault();
    }));

    return {
        show: () => {
            if (veil) return;
            veil = host.createDrawingLayer(VEIL_Z_INDEX);
            veil.clear(DIMMED_WHEEL);
            loader.show();
        },
        hide: () => {
            loader.hide();
            if (!veil) return;
            host.removeDrawingLayer(veil);
            veil = null;
            for (const listener of closedListeners) listener();
        },
        isShown: () => Boolean(veil),
    };
}
