// ============================================================
// Main menu module: owns the whole main menu order. Add-ons add their
// entries (label, action, position, and optionally a "shown when"
// predicate checked on each opening); on each opening it sorts them and
// PinballY's own items into fixed sections split by separators: Play and
// the launches, the player, the selected table, the table lists, the
// filter groups, any item it does not know, then Return. A section with no
// item shown goes with its separator, and the Add-on order in main.js
// never decides where an entry lands.
// It owns the entry commands and runs the matching action when one is
// selected, and can reopen the main menu with the cursor on an entry (a
// screen going back one level). Listens to "menuopen" and "command".
// ============================================================

import { safeHandler } from "../core/safe_handler.js";
import { createPinballYHost } from "../core/pinbally_host.js";

const SCRIPT_NAME = "MainMenu";

// Slots for PinballY's items, matched by command: builtIn lists built-in
// command names, filters takes every filter's command (the [Top] filters,
// the only ones in the main menu). Items sharing a slot keep PinballY's order.
const UNKNOWN = { unknown: true };
const FILTER_GROUPS = {
    builtIn: ["FilterByEra", "FilterByManufacturer", "FilterBySystem", "FilterByCategory", "FilterByRating", "FilterByRecency", "FilterByAdded"],
};

// Sections from the top down, each listing its slots in menu order: a
// string names a pack entry's position, an object places PinballY's items.
const SECTIONS = [
    [{ builtIn: ["PlayGame"] }, "TABLE_OF_THE_DAY", "TABLE_OF_THE_WEEK", "RANDOM_GAME"],
    ["PROFILE_PICKER", "ACHIEVEMENT_LIST", "PROFILE_STATS"],
    [
        "HIGH_SCORE_BOARD",
        { builtIn: ["GameInfo"] }, { builtIn: ["Flyer"] }, { builtIn: ["HighScores"] }, { builtIn: ["Instructions"] },
        { builtIn: ["RateGame"] }, { builtIn: ["AddFavorite", "RemoveFavorite"] },
        "TABLE_SETUP",
    ],
    [{ filters: true }],
    [FILTER_GROUPS],
    [UNKNOWN],
    [{ builtIn: ["MenuReturn"] }],
];

const SLOTS = SECTIONS.flatMap((slots, section) => slots.map((slot, order) => ({ slot, position: Object.freeze({ section, order }) })));

export const MAIN_MENU_POSITION = Object.freeze(Object.fromEntries(SLOTS
    .filter(({ slot }) => typeof slot === "string")
    .map(({ slot, position }) => [slot, position])));

const NATIVE_SLOTS = SLOTS.filter(({ slot }) => typeof slot !== "string");
const UNKNOWN_POSITION = NATIVE_SLOTS.find(({ slot }) => slot === UNKNOWN).position;

const SEPARATOR_CMD = -1;
// PinballY titles its separators "", the pack leaves them untitled.
const isSeparator = item => item.cmd < 0 && !item.title;

const comparePositions = (a, b) => a.section - b.section || a.order - b.order;

export function createMainMenu(host) {
    // Sorted by position.
    const entries = [];
    // The entry the cursor goes to on the next main menu opening, or null.
    let entryToSelect = null;

    // shownWhen: optional, the entry is left out of the menu when it returns
    // false. Guarded on its own, so a failing one hides only its own entry.
    function add({ name, label, position, action, shownWhen = () => true }) {
        const entry = { name, label, position, action, shownWhen: safeHandler(SCRIPT_NAME, shownWhen), cmd: host.allocateCommand(name) };
        const insertAt = entries.findIndex(other => comparePositions(other.position, position) > 0);
        if (insertAt === -1) entries.push(entry);
        else entries.splice(insertAt, 0, entry);
    }

    // The position of one of PinballY's items, by its command.
    function nativePositionOf(cmd) {
        const isFilter = cmd >= host.getBuiltInCommand("FilterFirst") && cmd <= host.getBuiltInCommand("FilterLast");
        const found = NATIVE_SLOTS.find(({ slot }) => (slot.filters
            ? isFilter
            : Boolean(slot.builtIn) && slot.builtIn.some(name => host.getBuiltInCommand(name) === cmd)));
        return found ? found.position : UNKNOWN_POSITION;
    }

    // Fires when any menu opens, with a fresh item list each time: sorts the
    // entries shown this time and PinballY's items into their sections.
    // Items removed by a listener registered earlier stay removed; one
    // registered later (Menu Cleanup, the High Scores) tidies the
    // separators its removals leave.
    host.on("menuopen", safeHandler(SCRIPT_NAME, ev => {
        if (ev.id !== "main") return;
        const shown = entries.filter(entry => entry.shownWhen());
        const selected = shown.find(entry => entry.name === entryToSelect);
        entryToSelect = null;
        // Array sort is stable: items sharing a slot keep their order.
        const placed = [
            ...shown.map(({ label, cmd, position }) => ({ item: { title: label, cmd }, position })),
            ...ev.items.filter(item => !isSeparator(item)).map(item => ({ item, position: nativePositionOf(item.cmd) })),
        ].sort((a, b) => comparePositions(a.position, b.position));
        const items = [];
        placed.forEach(({ item, position }, index) => {
            if (index > 0 && placed[index - 1].position.section !== position.section) items.push({ cmd: SEPARATOR_CMD });
            items.push(item);
        });
        if (selected) for (const item of items) item.selected = item.cmd === selected.cmd;
        ev.items = items;
        // PinballY ignores edits to ev.items unless menuUpdated is set.
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
