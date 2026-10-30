// ============================================================
// Pack Update start, from the Update Prompt's "Update now": records the
// requested Pack Version and the running one, shows the blocking wait and asks
// the host to start the Pack Update helper, which quits PinballY once ready.
// A helper not ready in time shows the failure at once (docs/adr/0018).
// - The wait holds the wheel dialog queue: no Startup Screen opens just before PinballY quits.
// ============================================================

import lang from "../core/i18n.js";
import { safeHandler } from "../core/safe_handler.js";
import { logError } from "../core/error_log.js";
import { createPinballYHost } from "../core/pinbally_host.js";
import { PACK_VERSION } from "../core/pack_version.js";
import { DIALOG_PRIORITY, getWheelDialogs } from "../core/wheel_dialog.js";
import { createBlockingWait } from "../drawing/blocking_wait.js";
import { getUpdateState } from "./update_state.js";

const SCRIPT_NAME = "PackUpdate";
const FAILED_MENU_ID = "packUpdateFailed";

// dialogs: the wheel dialog queue (common/core/wheel_dialog.js).
export function createPackUpdater(host, state, dialogs) {
    const { packUpdates: TEXT } = lang;
    const wait = createBlockingWait(host, dialogs, { scriptName: SCRIPT_NAME, caption: TEXT.downloadingUpdate });

    // Submitted before the wait goes, so it opens ahead of the Startup Screen.
    const failed = safeHandler(SCRIPT_NAME, error => {
        logError(SCRIPT_NAME, `ERROR Pack Update not possible: ${error.message}`, host, error);
        state.forgetRequest();
        dialogs.submit({
            id: FAILED_MENU_ID, title: TEXT.updateFailedTitle, message: TEXT.updateFailed, buttons: [{ label: TEXT.ok }], priority: DIALOG_PRIORITY.UPDATE_RESULT,
        });
        wait.hide();
    });

    // release: { packVersion, zipUrl, sha256 }, as the update state remembers it.
    function start({ packVersion, zipUrl, sha256 }) {
        if (wait.isShown()) return;
        host.log(`[${SCRIPT_NAME}] Pack Update to ${packVersion} asked.`);
        state.requestUpdate(packVersion, PACK_VERSION);
        wait.show();
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
