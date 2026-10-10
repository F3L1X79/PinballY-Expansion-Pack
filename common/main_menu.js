// ============================================================
// Main menu module: Add-ons add their entries (label, action, position,
// and optionally a "shown when" predicate checked on each opening) and it
// inserts them into PinballY's main menu right after "Play", grouped in
// sections (launch, table setup, then personal) split by separators, in a
// fixed position order, so the Add-on order in main.js never decides where
// an entry lands.
// It owns the entry commands and runs the matching action when one is
// selected, and can reopen the main menu with the cursor on an entry (a
// screen going back one level). Listens to "menuopen" and "command".
// ============================================================

import { safeHandler } from "./safe_handler.js";
import { createPinballYHost } from "./pinbally_host.js";

const SCRIPT_NAME = "MainMenu";

// Sections from "Play" down, each listing its entries in menu order. A
// section with no shown entry is left out with its separator.
const SECTIONS = [
    ["TABLE_OF_THE_DAY", "TABLE_OF_THE_WEEK", "RANDOM_GAME"],
    ["TABLE_SETUP"],
    ["PROFILE_PICKER", "ACHIEVEMENT_LIST", "PROFILE_STATS"],
];

export const MAIN_MENU_POSITION = Object.freeze(Object.fromEntries(SECTIONS.flatMap((names, section) =>
    names.map((name, order) => [name, Object.freeze({ section, order })]))));

const SEPARATOR_CMD = -1;

function comesAfter(position, other) {
    return position.section > other.section || (position.section === other.section && position.order > other.order);
}

export function createMainMenu(host) {
    // Sorted by position.
    const entries = [];
    // The entry the cursor goes to on the next main menu opening, or null.
    let entryToSelect = null;

    // shownWhen: optional, the entry is left out of the menu when it returns
    // false. Guarded on its own, so a failing one hides only its own entry.
    function add({ name, label, position, action, shownWhen = () => true }) {
        const entry = { name, label, position, action, shownWhen: safeHandler(SCRIPT_NAME, shownWhen), cmd: host.allocateCommand(name) };
        const insertAt = entries.findIndex(other => comesAfter(other.position, position));
        if (insertAt === -1) entries.push(entry);
        else entries.splice(insertAt, 0, entry);
    }

    // Fires when any menu opens, with a fresh item list each time: adds the
    // entries shown this time to the main menu.
    host.on("menuopen", safeHandler(SCRIPT_NAME, ev => {
        if (ev.id !== "main") return;
        const shown = entries.filter(entry => entry.shownWhen());
        const selected = shown.find(entry => entry.name === entryToSelect);
        entryToSelect = null;
        if (shown.length === 0) return;
        const items = [];
        shown.forEach(({ label, cmd, position }, index) => {
            if (index > 0 && shown[index - 1].position.section !== position.section) items.push({ cmd: SEPARATOR_CMD });
            items.push({ title: label, cmd });
        });
        const play = host.getBuiltInCommand("PlayGame");
        const playIndex = ev.items.findIndex(item => item.cmd === play);
        const afterPlay = playIndex === -1 ? undefined : ev.items[playIndex + 1];
        // Native entries follow in their own section, unless PinballY already
        // starts it with a separator.
        if (afterPlay && afterPlay.cmd !== SEPARATOR_CMD) items.push({ cmd: SEPARATOR_CMD });
        ev.addMenuItem({ after: play }, items);
        if (!selected) return;
        // PinballY ignores edits to ev.items unless menuUpdated is set.
        for (const item of ev.items) item.selected = item.cmd === selected.cmd;
        ev.menuUpdated = true;
    }));

    // Opens the main menu with the cursor on the named entry.
    function reopenOn(name) {
        entryToSelect = name;
        host.doCommand(host.getBuiltInCommand("ShowMainMenu"));
    }

    // Fires on every command; async because an action may animate the
    // wheel, so its rejections are logged too.
    host.on("command", safeHandler(SCRIPT_NAME, async ev => {
        const entry = entries.find(item => item.cmd === ev.id);
        if (entry) await entry.action();
    }));

    return { add, reopenOn };
}

let sharedMainMenu = null;

// One main menu for every Add-on, so their entries are ordered together.
export function getMainMenu() {
    if (!sharedMainMenu) sharedMainMenu = createMainMenu(createPinballYHost());
    return sharedMainMenu;
}
