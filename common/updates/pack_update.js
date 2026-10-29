// ============================================================
// Pack Update start, from the Update Prompt's "Update now": records the
// requested Pack Version, shows the Loader over the dimmed wheel and asks
// the host to start the Pack Update helper, which quits PinballY once ready.
// A helper not ready in time shows the failure at once (docs/adr/0018).
// - Holds the wheel dialog queue while it waits: no Startup Screen opens just before PinballY quits.
// - Blocks the buttons meanwhile, as Restart now does: no table launched under the Loader.
// ============================================================

import lang from "../core/i18n.js";
import { safeHandler } from "../core/safe_handler.js";
import { logError } from "../core/error_log.js";
import { createPinballYHost } from "../core/pinbally_host.js";
import { DIALOG_PRIORITY, getWheelDialogs } from "../core/wheel_dialog.js";
import { DRAWN_MENU_Z_INDEX } from "../drawn_menu/drawn_menu_painter.js";
import { createLoader } from "../drawing/loader.js";
import { DIMMED_WHEEL } from "../drawing/steamball_drawing.js";
import { getUpdateState } from "./update_state.js";

const SCRIPT_NAME = "PackUpdate";
const FAILED_MENU_ID = "packUpdateFailed";
// Just under the Drawn Menus, which the failure message shows over.
const VEIL_Z_INDEX = DRAWN_MENU_Z_INDEX.backdrop - 2;
const LOADER_Z_INDEX = DRAWN_MENU_Z_INDEX.backdrop - 1;

// dialogs: the wheel dialog queue (common/core/wheel_dialog.js).
export function createPackUpdater(host, state, dialogs) {
    const { packUpdates: TEXT } = lang;
    const loader = createLoader(host, { zIndex: LOADER_Z_INDEX });
    let veil = null;
    const closedListeners = [];

    // Handed to the queue as a screen over the wheel, open while the helper gets ready.
    dialogs.waitFor({
        isOpen: () => Boolean(veil),
        onClosed: listener => { closedListeners.push(listener); },
    });

    // Fires on every mapped button press: while the helper gets ready, no
    // button moves the wheel or launches a table that the quit would cut.
    host.on("commandbuttondown", safeHandler(SCRIPT_NAME, ev => {
        if (veil) ev.preventDefault();
    }));

    function hideVeil() {
        loader.hide();
        if (!veil) return;
        host.removeDrawingLayer(veil);
        veil = null;
        for (const listener of closedListeners) listener();
    }

    // Submitted before the veil goes, so it opens ahead of the Startup Screen.
    const failed = safeHandler(SCRIPT_NAME, error => {
        logError(SCRIPT_NAME, `ERROR Pack Update not possible: ${error.message}`, host, error);
        state.forgetRequest();
        dialogs.submit({
            id: FAILED_MENU_ID, title: TEXT.updateFailedTitle, message: TEXT.updateFailed, buttons: [{ label: TEXT.ok }], priority: DIALOG_PRIORITY.UPDATE_RESULT,
        });
        hideVeil();
    });

    // release: { packVersion, zipUrl, sha256 }, as the update state remembers it.
    function start({ packVersion, zipUrl, sha256 }) {
        if (veil) return;
        host.log(`[${SCRIPT_NAME}] Pack Update to ${packVersion} asked.`);
        state.requestUpdate(packVersion);
        veil = host.createDrawingLayer(VEIL_Z_INDEX);
        veil.clear(DIMMED_WHEEL);
        loader.show();
        try {
            host.startPackUpdate({
                zipUrl, sha256, packVersion,
                onQuitting: safeHandler(SCRIPT_NAME, () => host.log(`[${SCRIPT_NAME}] Pack Update helper ready, quitting.`)),
                onFailed: failed,
            });
        } catch (error) {
            failed(error);
        }
    }

    return { start };
}

let sharedPackUpdater = null;

export function getPackUpdater() {
    if (!sharedPackUpdater) sharedPackUpdater = createPackUpdater(createPinballYHost(), getUpdateState(), getWheelDialogs());
    return sharedPackUpdater;
}
