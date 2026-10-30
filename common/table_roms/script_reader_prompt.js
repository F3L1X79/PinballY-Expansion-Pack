// ============================================================
// Script Reader Prompt: at init, while vpxtool.exe is missing or its version
// remembered at an earlier start is older than the Script Reader Version, opens
// its Dialog ahead of the Startup Screen, only for a last active Profile that sees the
// setup entries and while "Offer vpxtool" is on. "Install" or "Update" starts the
// Script Reader install; "No thanks" writes OFFER_VPXTOOL=false to .env.local.
// - Exit answers nothing: asked again at the next start, as is a Profile that can't answer.
// ============================================================

import config from "../core/config.js";
import { envKeyOf } from "../core/env_overrides.js";
import { createPinballYHost } from "../core/pinbally_host.js";
import { logError } from "../core/error_log.js";
import { DIALOG_PRIORITY, getWheelDialogs } from "../core/wheel_dialog.js";
import { getStartupVeil } from "../drawing/startup_veil.js";
import { getProfileStore } from "../profiles/profile_store.js";
import { seesSetupEntries } from "../profiles/setup_entries.js";
import { saveEnvSetting } from "../settings/env_local_rewrite.js";
import { getScriptReaderInstaller, scriptReaderDialogText } from "./script_reader_install.js";
import { getScriptReaderState } from "./script_reader_state.js";

const SCRIPT_NAME = "ScriptReaderPrompt";
const MENU_ID = "scriptReaderPrompt";
const OFFERED_KINDS = ["install", "update"];

// dialogs: the wheel dialog queue; installer: what "Install" starts
// (common/table_roms/script_reader_install.js); state: the Script Reader
// state; running: the configuration loaded at startup; onShown: run as the prompt shows.
export function submitScriptReaderPrompt(host, {
    profileStore, dialogs, installer, state, running, onShown = () => {},
}) {
    const offer = state.offer();
    if (!running.offerVpxtool || !offer || !OFFERED_KINDS.includes(offer.kind)) return;
    if (!seesSetupEntries(profileStore)) {
        host.log(`[${SCRIPT_NAME}] Kept for a start whose Profile sees the setup entries.`);
        return;
    }

    function refuse() {
        try {
            saveEnvSetting(host, "offerVpxtool", false, SCRIPT_NAME);
        } catch (error) {
            logError(SCRIPT_NAME, `ERROR saving ${envKeyOf("offerVpxtool")}=false in .env.local: ${error.message}; asked again at the next start.`, host, error);
            return;
        }
        // Holds at once, with no restart to ask: the Settings line reads Off.
        running.offerVpxtool = false;
    }

    const { title, message, install, noThanks } = scriptReaderDialogText(offer);
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
        state: getScriptReaderState(),
        running: config,
        // The Startup Screen's Loader would turn under the prompt, and swallow its Exit.
        onShown: () => getStartupVeil().hideLoader(),
    });
}
