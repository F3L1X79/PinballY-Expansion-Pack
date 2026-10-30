// ============================================================
// Script Reader install: from the Script Reader Prompt's "Install", shows the
// captioned Loader over the dimmed wheel while the host's hidden helper swaps
// in vpxtool at the Script Reader Version, PinballY staying open, then a
// result Dialog. Listeners hear how it ended (the Table ROMs reading starts).
// - Holds the wheel dialog queue and blocks the buttons while it waits.
// - Counted failed after 90 s; a failure goes to the Error Log too.
// ============================================================

import lang from "../core/i18n.js";
import { safeHandler } from "../core/safe_handler.js";
import { logError } from "../core/error_log.js";
import { createPinballYHost, SCRIPT_READER_INSTALL_LOG_HINT } from "../core/pinbally_host.js";
import { DIALOG_PRIORITY, getWheelDialogs } from "../core/wheel_dialog.js";
import { DRAWN_MENU_Z_INDEX } from "../drawn_menu/drawn_menu_painter.js";
import { createLoader } from "../drawing/loader.js";
import { DIMMED_WHEEL } from "../drawing/steamball_drawing.js";
import { SCRIPT_READER_VERSION } from "./script_reader_version.js";

const SCRIPT_NAME = "ScriptReaderInstall";
const RESULT_MENU_ID = "scriptReaderInstalled";
export const SCRIPT_READER_INSTALL_TIMEOUT_MS = 90 * 1000;
const POLL_MS = 500;
// Just under the Drawn Menus, which the result shows over.
const VEIL_Z_INDEX = DRAWN_MENU_Z_INDEX.backdrop - 2;
const LOADER_Z_INDEX = DRAWN_MENU_Z_INDEX.backdrop - 1;

// The Script Reader Prompt's words, the Settings' install line's too:
// { title, message, install, noThanks }.
export function scriptReaderDialogText(release = SCRIPT_READER_VERSION) {
    const { scriptReader: TEXT } = lang;
    return { title: TEXT.dialogTitle(release.version), message: `${TEXT.dialog} ${TEXT.later}`, install: TEXT.install, noThanks: TEXT.noThanks };
}

// dialogs: the wheel dialog queue (common/core/wheel_dialog.js); release:
// the Script Reader Version.
export function createScriptReaderInstaller(host, dialogs, release = SCRIPT_READER_VERSION) {
    const { scriptReader: TEXT } = lang;
    const loader = createLoader(host, { zIndex: LOADER_Z_INDEX, caption: TEXT.downloading });
    let veil = null;
    const closedListeners = [];
    const finishedListeners = [];

    // Handed to the queue as a screen over the wheel, open while the helper works.
    dialogs.waitFor({
        isOpen: () => Boolean(veil),
        onClosed: listener => { closedListeners.push(listener); },
    });

    // Fires on every mapped button press: while vpxtool is swapped, no
    // button moves the wheel or launches a table.
    host.on("commandbuttondown", safeHandler(SCRIPT_NAME, ev => {
        if (veil) ev.preventDefault();
    }));

    // The result is submitted before the veil goes, so it opens first.
    function finish(installed) {
        dialogs.submit({
            id: RESULT_MENU_ID,
            title: installed ? TEXT.installedTitle : TEXT.failedTitle,
            message: installed ? TEXT.installed(release.version) : TEXT.failed,
            buttons: [{ label: TEXT.ok }],
            priority: DIALOG_PRIORITY.UPDATE_RESULT,
        });
        loader.hide();
        host.removeDrawingLayer(veil);
        veil = null;
        for (const listener of closedListeners) listener();
        for (const listener of finishedListeners) listener(installed);
    }

    const failed = reason => {
        logError(SCRIPT_NAME, `ERROR vpxtool v${release.version} not installed: ${reason}; see ${SCRIPT_READER_INSTALL_LOG_HINT}`, host);
        finish(false);
    };

    function start() {
        if (veil) return;
        host.log(`[${SCRIPT_NAME}] vpxtool v${release.version} install asked.`);
        veil = host.createDrawingLayer(VEIL_Z_INDEX);
        veil.clear(DIMMED_WHEEL);
        loader.show();
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
                finish(true);
            }
        });
        host.setTimeout(poll, POLL_MS);
    }

    return {
        start,
        isRunning: () => Boolean(veil),
        // listener(installed): runs, guarded, once each install has ended.
        onFinished: listener => { finishedListeners.push(safeHandler(SCRIPT_NAME, listener)); },
    };
}

let sharedInstaller = null;

export function getScriptReaderInstaller() {
    if (!sharedInstaller) sharedInstaller = createScriptReaderInstaller(createPinballYHost(), getWheelDialogs());
    return sharedInstaller;
}
