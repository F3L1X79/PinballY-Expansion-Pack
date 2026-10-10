// ============================================================
// Profile Reset menus, opened from PinballY's Exit menu: the list of every
// Profile, ending with "Every Profile" when there are two or more, then one
// confirmation, cursor on "No"; "Yes" resets them, a failure not stopping the
// others, and a one-line message with "OK" tells the outcome (causes go to the
// log only). The player asked for them, so they open directly through the
// Drawn Menu module, not through the wheel dialog module. Listens to
// "command".
// ============================================================

import lang from "./i18n.js";
import { displayNameOf } from "./profile_name.js";
import { logHandlerError, safeHandler } from "./safe_handler.js";
import { createNativeMenus } from "./drawn_menu.js";

const SCRIPT_NAME = "ProfileReset";
const LIST_MENU_ID = "profileResetList";
const CONFIRM_MENU_ID = "profileResetConfirm";
const OUTCOME_MENU_ID = "profileResetOutcome";

// menus: what shows the menus (common/drawn_menu.js).
export function createProfileResetMenu(host, profileStore, menus = createNativeMenus(host)) {
    const { profileReset: TEXT } = lang;
    const yesCommand = host.allocateCommand("profileResetYes");
    const everyProfileCommand = host.allocateCommand("profileResetEveryProfile");
    const cancelCommand = host.getBuiltInCommand("MenuReturn");
    // One command per line of the list, by position, allocated on demand:
    // the household can grow while PinballY runs.
    const profileCommands = [];
    // The Profiles of the list on screen, then those the confirmation names.
    let listedProfiles = [];
    let profilesToReset = null;

    function getProfileCommand(index) {
        while (profileCommands.length <= index) {
            profileCommands.push(host.allocateCommand(`profileResetProfile${profileCommands.length}`));
        }
        return profileCommands[index];
    }

    // With Guest alone, "Every Profile" would only repeat its line.
    const offersEveryProfile = () => listedProfiles.length >= 2;

    function open() {
        listedProfiles = profileStore.listProfiles();
        menus.show(LIST_MENU_ID, [
            { title: TEXT.listTitle, cmd: -1 },
            { cmd: -1 },
            ...listedProfiles.map((profile, index) => ({ title: displayNameOf(profile), cmd: getProfileCommand(index) })),
            { cmd: -1 },
            // Its own separator before Cancel; without it, the one above already sets Cancel apart.
            ...(offersEveryProfile() ? [{ title: TEXT.everyProfile, cmd: everyProfileCommand }, { cmd: -1 }] : []),
            { title: TEXT.cancel, cmd: cancelCommand },
        ]);
    }

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

    // Fires on every command: a Profile of the list, or "Every Profile", asks
    // for confirmation, "Yes" resets them and shows the outcome.
    host.on("command", safeHandler(SCRIPT_NAME, ev => {
        const index = profileCommands.indexOf(ev.id);
        if (index >= 0 && index < listedProfiles.length) {
            confirm([listedProfiles[index]]);
        } else if (ev.id === everyProfileCommand && offersEveryProfile()) {
            confirm(listedProfiles);
        } else if (ev.id === yesCommand && profilesToReset) {
            const profiles = profilesToReset;
            profilesToReset = null;
            resetAndReport(profiles);
        }
    }));

    return { open };
}
