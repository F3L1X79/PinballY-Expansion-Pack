// ============================================================
// Profile Reset menus, opened from Manage profiles: one confirmation on
// "No", then a one-line outcome. Opens directly through the Drawn Menu
// module. Listens to "command".
// - A failure does not stop the other resets; causes go to the log only.
// ============================================================

import lang from "../core/i18n.js";
import { displayNameOf } from "../profiles/profile_name.js";
import { logHandlerError, safeHandler } from "../core/safe_handler.js";
import { createNativeMenus } from "../drawn_menu/drawn_menu.js";

const SCRIPT_NAME = "ProfileReset";
const CONFIRM_MENU_ID = "profileResetConfirm";
const OUTCOME_MENU_ID = "profileResetOutcome";

// menus: what shows the menus (common/drawn_menu/drawn_menu.js).
export function createProfileResetMenu(host, profileStore, menus = createNativeMenus(host)) {
    const { profileReset: TEXT } = lang;
    const yesCommand = host.allocateCommand("profileResetYes");
    const cancelCommand = host.getBuiltInCommand("MenuReturn");
    // The Profiles the confirmation names.
    let profilesToReset = null;

    function confirm(profiles) {
        profilesToReset = profiles;
        const question = profiles.length === 1 ? TEXT.confirm(displayNameOf(profiles[0])) : TEXT.confirmEvery(profiles.length);
        menus.show(CONFIRM_MENU_ID, [
            { title: question, cmd: -1 },
            { cmd: -1 },
            { title: TEXT.yes, cmd: yesCommand },
            { title: TEXT.no, cmd: cancelCommand, selected: true },
        ], { dialogStyle: true });
    }

    // Resets the Profiles one by one, then shows the outcome: each failure is
    // caught here, not by safeHandler, for the others to go on and the player
    // to see it; its cause goes to the log.
    function resetAndReport(profiles) {
        const failedNames = [];
        for (const profile of profiles) {
            try {
                profileStore.resetProfile(profile.name);
            } catch (error) {
                logHandlerError(SCRIPT_NAME, error);
                failedNames.push(displayNameOf(profile));
            }
        }
        const resetCount = profiles.length - failedNames.length;
        let message;
        if (profiles.length === 1) {
            message = failedNames.length > 0 ? TEXT.failed(failedNames[0]) : TEXT.done(displayNameOf(profiles[0]));
        } else {
            message = failedNames.length > 0 ? TEXT.everyFailed(resetCount, failedNames) : TEXT.everyDone(resetCount);
        }
        menus.show(OUTCOME_MENU_ID, [
            { title: message, cmd: -1 },
            { cmd: -1 },
            { title: TEXT.ok, cmd: cancelCommand, selected: true },
        ], { dialogStyle: true });
    }

    // Fires on every command: "Yes" resets the Profiles and shows the outcome.
    host.on("command", safeHandler(SCRIPT_NAME, ev => {
        if (ev.id === yesCommand && profilesToReset) {
            const profiles = profilesToReset;
            profilesToReset = null;
            resetAndReport(profiles);
        }
    }));

    // confirm(profiles): asks before resetting these Profiles ({ name, isGuest }).
    return { confirm };
}
