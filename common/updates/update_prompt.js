// ============================================================
// Update Prompt: at init, from what an earlier start's Update Check
// remembered, asks "Update now" or "Later" about a newer Pack Version, ahead
// of the Startup Screen (docs/adr/0018). Once per Pack Version, only for a
// last active Profile that sees the setup entries; "Update now" starts the Pack Update.
// - Never from the current start's reply: that one is for the next start.
// - Marked offered once shown, so Exit counts as "Later"; a Profile that can't answer marks nothing.
// ============================================================

import lang from "../core/i18n.js";
import config from "../core/config.js";
import { createPinballYHost } from "../core/pinbally_host.js";
import { DIALOG_PRIORITY, getWheelDialogs } from "../core/wheel_dialog.js";
import { getStartupVeil } from "../drawing/startup_veil.js";
import { getProfileStore } from "../profiles/profile_store.js";
import { seesSetupEntries } from "../profiles/setup_entries.js";
import { installableRelease } from "./update_check.js";
import { getUpdateState } from "./update_state.js";
import { getPackUpdater } from "./pack_update.js";

const SCRIPT_NAME = "UpdatePrompt";
const MENU_ID = "updatePrompt";

// The release to offer at this start, or null: why not is logged.
function releaseToOffer(host, { state, profileStore, enabled }) {
    const log = message => host.log(`[${SCRIPT_NAME}] ${message}`);
    if (!enabled) return null;
    const release = installableRelease(host, state);
    if (!release || release.packVersion === state.offeredVersion()) return null;
    if (!seesSetupEntries(profileStore)) {
        log(`Pack Version ${release.packVersion} kept for a start whose Profile sees the setup entries.`);
        return null;
    }
    return release;
}

// dialogs: the wheel dialog queue; updater: what "Update now" starts
// (common/updates/pack_update.js); onShown: run as the prompt shows.
export function submitUpdatePrompt(host, { state, profileStore, dialogs, updater, enabled, onShown = () => {} }) {
    const { packUpdates: TEXT } = lang;
    const release = releaseToOffer(host, { state, profileStore, enabled });
    if (!release) return;
    dialogs.submit({
        id: MENU_ID,
        title: TEXT.promptTitle,
        message: TEXT.prompt(release.packVersion),
        buttons: [
            { label: TEXT.updateNow, action: () => updater.start(release) },
            { label: TEXT.later },
        ],
        priority: DIALOG_PRIORITY.UPDATE_PROMPT,
        onShown: () => {
            state.markOffered(release.packVersion);
            host.log(`[${SCRIPT_NAME}] Pack Version ${release.packVersion} offered.`);
            onShown();
        },
    });
}

export function startUpdatePrompt() {
    submitUpdatePrompt(createPinballYHost(), {
        state: getUpdateState(),
        profileStore: getProfileStore(),
        dialogs: getWheelDialogs(),
        // Created on "Update now" only: most starts offer nothing.
        updater: { start: release => getPackUpdater().start(release) },
        enabled: config.updateCheck,
        // The Startup Screen's Loader would turn under the prompt, and swallow its Exit.
        onShown: () => getStartupVeil().hideLoader(),
    });
}
