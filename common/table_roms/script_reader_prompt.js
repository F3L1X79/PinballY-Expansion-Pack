// ============================================================
// Script Reader Prompt: at init, while vpxtool.exe is missing, opens its
// Dialog ahead of the Startup Screen, only for a last active
// Profile that sees the setup entries and while "Offer vpxtool" is on.
// "Install" starts the Script Reader install; "No thanks" writes OFFER_VPXTOOL=false to .env.local.
// - Exit answers nothing: asked again at the next start, as is a Profile that can't answer.
// ============================================================

import config from "../core/config.js";
import { createPinballYHost } from "../core/pinbally_host.js";
import { logError } from "../core/error_log.js";
import { DIALOG_PRIORITY, getWheelDialogs } from "../core/wheel_dialog.js";
import { getStartupVeil } from "../drawing/startup_veil.js";
import { getProfileStore } from "../profiles/profile_store.js";
import { seesSetupEntries } from "../profiles/setup_entries.js";
import { rewriteEnvLine } from "../settings/env_local_rewrite.js";
import { getScriptReaderInstaller, scriptReaderDialogText } from "./script_reader_install.js";

const SCRIPT_NAME = "ScriptReaderPrompt";
const MENU_ID = "scriptReaderPrompt";

// dialogs: the wheel dialog queue; installer: what "Install" starts
// (common/table_roms/script_reader_install.js); running: the configuration
// loaded at startup; onShown: run as the prompt shows.
export function submitScriptReaderPrompt(host, { profileStore, dialogs, installer, running, onShown = () => {} }) {
    if (!running.offerVpxtool) return;
    if (!seesSetupEntries(profileStore)) {
        host.log(`[${SCRIPT_NAME}] Kept for a start whose Profile sees the setup entries.`);
        return;
    }
    const envLocalPath = `${host.getProjectFolder()}\\.env.local`;

    function refuse() {
        try {
            const text = host.files.fileExists(envLocalPath) ? host.files.readText(envLocalPath) : null;
            host.files.writeText(envLocalPath, rewriteEnvLine(text, "offerVpxtool", false));
        } catch (error) {
            logError(SCRIPT_NAME, `ERROR saving OFFER_VPXTOOL=false in .env.local: ${error.message}; asked again at the next start.`, host, error);
            return;
        }
        // Holds at once, with no restart to ask: the Settings line reads Off.
        running.offerVpxtool = false;
        host.log(`[${SCRIPT_NAME}] Saved OFFER_VPXTOOL=false in .env.local.`);
    }

    const { title, message, install, noThanks } = scriptReaderDialogText();
    dialogs.submit({
        id: MENU_ID,
        title,
        message,
        buttons: [
            { label: install, action: () => installer.start() },
            { label: noThanks, action: refuse },
        ],
        priority: DIALOG_PRIORITY.SCRIPT_READER_PROMPT,
        onShown,
    });
}

export function startScriptReaderPrompt() {
    submitScriptReaderPrompt(createPinballYHost(), {
        profileStore: getProfileStore(),
        dialogs: getWheelDialogs(),
        installer: getScriptReaderInstaller(),
        running: config,
        // The Startup Screen's Loader would turn under the prompt, and swallow its Exit.
        onShown: () => getStartupVeil().hideLoader(),
    });
}
