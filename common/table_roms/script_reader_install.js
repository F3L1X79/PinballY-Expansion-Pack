// ============================================================
// Script Reader install: from the Script Reader Prompt's "Install" or
// "Update", shows the blocking wait while the host's hidden helper swaps in
// vpxtool at the Script Reader Version, PinballY staying open, then a result
// Dialog; a success remembers the new version. Listeners hear how it ended.
// - The helper starts only once no vpxtool run is in progress (waitWhile): it replaces that file.
// - Counted failed 90 s after the helper starts; a failure goes to the Error Log too.
// ============================================================

import lang from "../core/i18n.js";
import { safeHandler } from "../core/safe_handler.js";
import { logError } from "../core/error_log.js";
import { createPinballYHost, SCRIPT_READER_INSTALL_LOG_HINT } from "../core/pinbally_host.js";
import { DIALOG_PRIORITY, getWheelDialogs } from "../core/wheel_dialog.js";
import { createBlockingWait } from "../drawing/blocking_wait.js";
import { SCRIPT_READER_VERSION } from "./script_reader_version.js";
import { getScriptReaderState } from "./script_reader_state.js";

const SCRIPT_NAME = "ScriptReaderInstall";
const RESULT_MENU_ID = "scriptReaderInstalled";
export const SCRIPT_READER_INSTALL_TIMEOUT_MS = 90 * 1000;
const POLL_MS = 500;

const isUpdate = offer => Boolean(offer) && offer.kind === "update";

// The Script Reader Prompt's words, the Settings' line's too, for the
// offer of the Script Reader state: { title, message, install, noThanks }.
export function scriptReaderDialogText(offer, release = SCRIPT_READER_VERSION) {
    const { scriptReader: TEXT } = lang;
    if (isUpdate(offer)) {
        return {
            title: TEXT.updateTitle(offer.installed, release.version), message: `${TEXT.dialog} ${TEXT.updateLater}`, install: TEXT.update, noThanks: TEXT.noThanks,
        };
    }
    return { title: TEXT.dialogTitle(release.version), message: `${TEXT.dialog} ${TEXT.later}`, install: TEXT.install, noThanks: TEXT.noThanks };
}

// dialogs: the wheel dialog queue (common/core/wheel_dialog.js); state: the
// Script Reader state (common/table_roms/script_reader_state.js); release:
// the Script Reader Version.
export function createScriptReaderInstaller(host, dialogs, state, release = SCRIPT_READER_VERSION) {
    const { scriptReader: TEXT } = lang;
    const wait = createBlockingWait(host, dialogs, { scriptName: SCRIPT_NAME, caption: TEXT.downloading });
    const finishedListeners = [];
    let isBusy = () => false;

    // The result is submitted before the wait goes, so it opens first.
    function finish(installed, updating) {
        const [title, message] = updating
            ? (installed ? [TEXT.updatedTitle, TEXT.updated(release.version)] : [TEXT.updateFailedTitle, TEXT.updateFailed])
            : (installed ? [TEXT.installedTitle, TEXT.installed(release.version)] : [TEXT.failedTitle, TEXT.failed]);
        dialogs.submit({
            id: RESULT_MENU_ID, title, message, buttons: [{ label: TEXT.ok }], priority: DIALOG_PRIORITY.UPDATE_RESULT,
        });
        wait.hide();
        for (const listener of finishedListeners) listener(installed);
    }

    function runHelper(updating) {
        const failed = reason => {
            logError(SCRIPT_NAME, `ERROR vpxtool v${release.version} not installed: ${reason}; see ${SCRIPT_READER_INSTALL_LOG_HINT}`, host);
            finish(false, updating);
        };
        let install;
        try {
            install = host.installScriptReader(release);
        } catch (error) {
            failed(error.message);
            return;
        }
        const startMs = host.now().getTime();
        // Fires every POLL_MS until the helper answers or the time is up;
        // any error ends the wait, which must never stay on screen.
        const poll = safeHandler(SCRIPT_NAME, () => {
            let result;
            try {
                result = install.result();
            } catch (error) {
                failed(error.message);
                return;
            }
            if (result === null && host.now().getTime() - startMs < SCRIPT_READER_INSTALL_TIMEOUT_MS) {
                host.setTimeout(poll, POLL_MS);
                return;
            }
            if (result === null) failed(`no answer from the helper within ${SCRIPT_READER_INSTALL_TIMEOUT_MS / 1000} s`);
            else if (result.exitCode !== 0) failed(`helper exit code ${result.exitCode}: ${result.output.trim()}`);
            else {
                host.log(`[${SCRIPT_NAME}] vpxtool v${release.version} installed.`);
                // Read again at the next start should it not be written.
                try {
                    state.rememberVersion(release.version);
                } catch (error) {
                    logError(SCRIPT_NAME, `ERROR remembering vpxtool v${release.version}: ${error.message}`, host, error);
                }
                finish(true, updating);
            }
        });
        host.setTimeout(poll, POLL_MS);
    }

    function start() {
        if (wait.isShown()) return;
        const updating = isUpdate(state.offer(release));
        host.log(`[${SCRIPT_NAME}] vpxtool v${release.version} install asked.`);
        wait.show();
        // Fires every POLL_MS while a vpxtool run goes on; the shown wait
        // holds the queue, so none starts after it.
        const startWhenFree = safeHandler(SCRIPT_NAME, () => {
            if (isBusy()) host.setTimeout(startWhenFree, POLL_MS);
            else runHelper(updating);
        });
        startWhenFree();
    }

    return {
        start,
        isRunning: wait.isShown,
        // busy(): true while a vpxtool run is in progress, which the helper waits for.
        waitWhile: busy => { isBusy = busy; },
        // listener(installed): runs, guarded, once each install has ended.
        onFinished: listener => { finishedListeners.push(safeHandler(SCRIPT_NAME, listener)); },
    };
}

let sharedInstaller = null;

export function getScriptReaderInstaller() {
    if (!sharedInstaller) sharedInstaller = createScriptReaderInstaller(createPinballYHost(), getWheelDialogs(), getScriptReaderState());
    return sharedInstaller;
}
