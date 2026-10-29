// ============================================================
// Manage profiles, opened from the Exit menu: the list of Profiles (and
// "Every profile"), then a Profile's own menu, where a mark line flips the
// mark at once and "Reset" leads to the Profile Reset. Opens directly
// through the Drawn Menu module. Listens to "command".
// - A line the mark rules forbid stays, greyed with its reason (setup_entries.js, ADR 0020).
// - Exit and Back go from a Profile's menu to the list only when drawn: natively, they close.
// - The active Profile clearing its own Admin mark closes the menus: it no longer has access.
// ============================================================

import lang from "../core/i18n.js";
import { displayNameOf } from "../profiles/profile_name.js";
import { markRefusal } from "../profiles/setup_entries.js";
import { logHandlerError, safeHandler } from "../core/safe_handler.js";
import { createNativeMenus } from "../drawn_menu/drawn_menu.js";
import { createProfileResetMenu } from "./profile_reset_menu.js";

const SCRIPT_NAME = "ManageProfiles";
const LIST_MENU_ID = "manageProfilesList";
const PROFILE_MENU_ID = "manageProfilesProfile";
const MARKS_FAILED_MENU_ID = "manageProfilesMarksFailed";
const SEPARATOR = { cmd: -1 };

// menus: what shows the menus (common/drawn_menu/drawn_menu.js).
export function createManageProfilesMenu(host, profileStore, menus = createNativeMenus(host)) {
    const { profileReset: TEXT } = lang;
    const profileReset = createProfileResetMenu(host, profileStore, menus);
    const everyProfileCommand = host.allocateCommand("manageProfilesEveryProfile");
    const adminCommand = host.allocateCommand("manageProfilesAdmin");
    const childCommand = host.allocateCommand("manageProfilesChild");
    const resetCommand = host.allocateCommand("manageProfilesReset");
    const menuReturnCommand = host.getBuiltInCommand("MenuReturn");
    // One command per line of the list, by position, allocated on demand:
    // the household can grow while PinballY runs.
    const profileCommands = [];
    // The Profiles of the list on screen, and the Profile whose menu is shown.
    let listedProfiles = [];
    let shownProfile = null;

    function getProfileCommand(index) {
        while (profileCommands.length <= index) {
            profileCommands.push(host.allocateCommand(`manageProfilesProfile${profileCommands.length}`));
        }
        return profileCommands[index];
    }

    // With Guest alone, "Every profile" would only repeat its line.
    const offersEveryProfile = () => listedProfiles.length >= 2;

    // The cursor on the entry with this command (the first entry for null),
    // set on the items so that a native menu opens on it too.
    const withCursorOn = (items, selectedCmd) => items.map(item => (selectedCmd !== null && item.cmd === selectedCmd ? { ...item, selected: true } : item));

    function open(selectedCmd = null) {
        listedProfiles = profileStore.listProfiles();
        shownProfile = null;
        menus.show(LIST_MENU_ID, withCursorOn([
            { title: TEXT.listTitle, cmd: -1 },
            SEPARATOR,
            ...listedProfiles.map((profile, index) => ({ title: displayNameOf(profile), cmd: getProfileCommand(index) })),
            SEPARATOR,
            // Its own separator before Cancel; without it, the one above already sets Cancel apart.
            ...(offersEveryProfile() ? [{ title: TEXT.everyProfile, cmd: everyProfileCommand }, SEPARATOR] : []),
            { title: TEXT.cancel, cmd: menuReturnCommand },
        ], selectedCmd));
    }

    // The list again, the cursor on the Profile it was left from.
    const backToList = profile => open(getProfileCommand(listedProfiles.findIndex(listed => listed.name === profile.name)));

    const isActive = profile => profile.name === profileStore.getActiveProfile().name;
    // The active Profile clearing its own Admin mark loses access to these menus.
    const losesAccess = (profile, marks, markName) => markName === "isAdmin" && marks.isAdmin && isActive(profile);

    // A mark line, greyed with its reason when the mark rules forbid it;
    // it stays open, the menu then shown again over itself, unless choosing
    // it takes the menus away from the active Profile.
    function markLine(profile, marks, markName, title, cmd) {
        const refusal = markRefusal(marks, markName);
        if (refusal) return { title, cmd, disabled: true, reason: TEXT.refusals[refusal] };
        return losesAccess(profile, marks, markName) ? { title, cmd } : { title, cmd, stayOpen: true };
    }

    function openProfile(profile, selectedCmd = null) {
        shownProfile = profile;
        const marks = profileStore.getMarksOf(profile.name);
        menus.show(PROFILE_MENU_ID, withCursorOn([
            { title: displayNameOf(profile), cmd: -1 },
            SEPARATOR,
            markLine(profile, marks, "isAdmin", TEXT.adminLine(marks.isAdmin), adminCommand),
            markLine(profile, marks, "isChild", TEXT.childLine(marks.isChild), childCommand),
            SEPARATOR,
            { title: TEXT.reset, cmd: resetCommand },
            { title: TEXT.back, cmd: menuReturnCommand },
        ], selectedCmd), { onBack: () => backToList(profile) });
    }

    // Flips the mark and shows the Profile's menu again on its line, unless
    // the active Profile just lost access to it. A failure is caught here,
    // not by safeHandler, for the player to see it; its cause goes to the
    // log, and OK goes back to the Profile's menu.
    function flipMark(profile, markName, lineCommand) {
        let marks;
        try {
            marks = profileStore.getMarksOf(profile.name);
            profileStore.setMark(profile.name, markName, !marks[markName]);
        } catch (error) {
            logHandlerError(SCRIPT_NAME, error);
            menus.show(MARKS_FAILED_MENU_ID, [
                { title: TEXT.marksFailed(displayNameOf(profile)), cmd: -1 },
                SEPARATOR,
                { title: TEXT.ok, cmd: menuReturnCommand, selected: true },
            ], { dialogStyle: true, onBack: () => openProfile(profile, lineCommand) });
            return;
        }
        if (!losesAccess(profile, marks, markName)) openProfile(profile, lineCommand);
    }

    // Fires on every command: a Profile of the list opens its menu, "Every
    // profile" and "Reset" ask to confirm the Profile Reset, a mark line flips its mark.
    host.on("command", safeHandler(SCRIPT_NAME, ev => {
        const index = profileCommands.indexOf(ev.id);
        if (index >= 0 && index < listedProfiles.length) openProfile(listedProfiles[index]);
        else if (ev.id === everyProfileCommand && offersEveryProfile()) profileReset.confirm(listedProfiles);
        else if (ev.id === adminCommand && shownProfile) flipMark(shownProfile, "isAdmin", adminCommand);
        else if (ev.id === childCommand && shownProfile) flipMark(shownProfile, "isChild", childCommand);
        else if (ev.id === resetCommand && shownProfile) profileReset.confirm([shownProfile]);
    }));

    return { open };
}
