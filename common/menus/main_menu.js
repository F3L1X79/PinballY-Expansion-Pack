// ============================================================
// Main menu module: owns the whole main menu order. Add-ons add their
// entries (label, action, position, and optionally a "shown when"
// predicate checked on each opening); on each opening it sorts them and
// PinballY's own items into fixed sections split by separators: Play and
// the launches, the player, the selected table, the table lists, "Filter
// Tables", any item it does not know, then Return. A section with no
// item shown goes with its separator, and the Add-on order in main.js
// never decides where an entry lands.
// PinballY's filter groups leave the main menu for the "Filter Tables"
// submenu, shown in place of a main menu opening (see FILTER_TABLES_MENU_ID);
// Back in it, or in a group menu opened from it, goes up one level.
// It owns the entry commands and runs the matching action when one is
// selected, and can reopen the main menu with the cursor on an entry (a
// screen going back one level). Listens to "menuopen", "menuclose",
// "command", "attractmodestart" and the game list's "filterselect".
// ============================================================

import { safeHandler } from "../core/safe_handler.js";
import { createPinballYHost } from "../core/pinbally_host.js";
import lang from "../core/i18n.js";

const SCRIPT_NAME = "MainMenu";

// Slots for PinballY's items, matched by command: builtIn lists built-in
// command names, filters takes every filter's command (the [Top] filters,
// the only ones in the main menu). Items sharing a slot keep PinballY's order.
const UNKNOWN = { unknown: true };
const FILTER_GROUP_COMMANDS = ["FilterByEra", "FilterByManufacturer", "FilterBySystem", "FilterByCategory", "FilterByRating", "FilterByRecency", "FilterByAdded"];

// The menu id of the "Filter Tables" submenu. It is shown by turning a main
// menu opening into it (ev.id and ev.items edited in "menuopen"), not with
// showMenu, which fires no "menuopen": so PinballY's groups are read as
// Menu Cleanup left them, and the Drawn Menus Add-on draws it like any
// other menu.
export const FILTER_TABLES_MENU_ID = "filter tables";
// PinballY's own group menus, opened from "Filter Tables".
const isFilterGroupMenu = id => id.startsWith("filter by ");
const FILTER_TABLES_ENTRY = "filterTables";

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
    ["FILTER_TABLES"],
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
    // Set when the next main menu opening shows "Filter Tables" instead:
    // { selectedCmd }, the group the cursor goes to (null for the first).
    let filterTablesOpening = null;
    // The group whose menu was opened from "Filter Tables", while it shows:
    // its Back entry reopening the main menu goes back to "Filter Tables".
    let openedGroupCmd = null;
    // The filter groups in the main menu being opened.
    let groupsShown = [];
    const groupCmds = FILTER_GROUP_COMMANDS.map(name => host.getBuiltInCommand(name));
    const isFilterCmd = cmd => cmd >= host.getBuiltInCommand("FilterFirst") && cmd <= host.getBuiltInCommand("FilterLast");
    const filterTablesBackCmd = host.allocateCommand("filterTablesBack");

    // shownWhen: optional, the entry is left out of the menu when it returns
    // false. Guarded on its own, so a failing one hides only its own entry.
    // hasSubmenu: the entry opens a submenu (the arrow).
    function add({ name, label, position, action, shownWhen = () => true, hasSubmenu = false }) {
        const entry = { name, label, position, action, hasSubmenu, shownWhen: safeHandler(SCRIPT_NAME, shownWhen), cmd: host.allocateCommand(name) };
        const insertAt = entries.findIndex(other => comparePositions(other.position, position) > 0);
        if (insertAt === -1) entries.push(entry);
        else entries.splice(insertAt, 0, entry);
    }

    // The position of one of PinballY's items, by its command.
    function nativePositionOf(cmd) {
        const found = NATIVE_SLOTS.find(({ slot }) => (slot.filters
            ? isFilterCmd(cmd)
            : Boolean(slot.builtIn) && slot.builtIn.some(name => host.getBuiltInCommand(name) === cmd)));
        return found ? found.position : UNKNOWN_POSITION;
    }

    // Opens "Filter Tables" with the cursor on this group (null: the first).
    function openFilterTables(selectedCmd) {
        filterTablesOpening = { selectedCmd };
        host.doCommand(host.getBuiltInCommand("ShowMainMenu"));
    }

    // Turns this main menu opening into "Filter Tables": PinballY's groups
    // in its order, then Back.
    function showFilterTables(ev, groups, selectedCmd) {
        ev.id = FILTER_TABLES_MENU_ID;
        ev.items = [
            ...groups.map(item => Object.assign({}, item, { selected: item.cmd === selectedCmd })),
            { cmd: SEPARATOR_CMD },
            { title: lang.customMenuLabels.filterTablesBack, cmd: filterTablesBackCmd },
        ];
        ev.menuUpdated = true;
    }

    // Fires when any menu opens, with a fresh item list each time: sorts the
    // entries shown this time and PinballY's items into their sections, or
    // shows "Filter Tables" in place of the main menu. Items removed by a
    // listener registered earlier (Menu Cleanup, before every Add-on using
    // this module in main.js) stay removed; one registered later (the High
    // Scores) tidies the separators its removals leave.
    host.on("menuopen", safeHandler(SCRIPT_NAME, ev => {
        if (ev.id !== "main") {
            if (!isFilterGroupMenu(ev.id)) openedGroupCmd = null;
            return;
        }
        // A group menu's Back entry opens the main menu again (PinballY's
        // own way back): "Filter Tables" shows instead, one level up.
        const opening = filterTablesOpening || (openedGroupCmd !== null ? { selectedCmd: openedGroupCmd } : null);
        filterTablesOpening = null;
        openedGroupCmd = null;
        const groups = ev.items.filter(item => groupCmds.includes(item.cmd));
        if (opening && groups.length > 0) {
            entryToSelect = null;
            showFilterTables(ev, groups, opening.selectedCmd);
            return;
        }
        groupsShown = groups;
        const shown = entries.filter(entry => entry.shownWhen());
        const selected = shown.find(entry => entry.name === entryToSelect);
        entryToSelect = null;
        // Array sort is stable: items sharing a slot keep their order.
        const placed = [
            ...shown.map(({ label, cmd, position, hasSubmenu }) => ({ item: hasSubmenu ? { title: label, cmd, hasSubmenu } : { title: label, cmd }, position })),
            ...ev.items
                .filter(item => !isSeparator(item) && !groupCmds.includes(item.cmd))
                .map(item => ({ item, position: nativePositionOf(item.cmd) })),
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

    // Back out of "Filter Tables", to the main menu on its entry.
    function backFromFilterTables() {
        reopenOn(FILTER_TABLES_ENTRY);
    }

    add({
        name: FILTER_TABLES_ENTRY,
        label: lang.customMenuLabels.filterTables,
        position: MAIN_MENU_POSITION.FILTER_TABLES,
        action: () => openFilterTables(null),
        shownWhen: () => groupsShown.length > 0,
        hasSubmenu: true,
    });

    // Fires when any menu closes: a group menu closed without going back
    // leaves the next opening to the main menu. PinballY fires it after the
    // "menuopen" of a menu shown in its place.
    host.on("menuclose", safeHandler(SCRIPT_NAME, ev => {
        if (isFilterGroupMenu(ev.id)) openedGroupCmd = null;
    }));

    // Fires when the cabinet sits idle, closing any menu.
    host.on("attractmodestart", safeHandler(SCRIPT_NAME, () => {
        openedGroupCmd = null;
        filterTablesOpening = null;
    }));

    // Fires when the player picks a filter, which closes the menus (a Drawn
    // group menu has no "menuclose" to say so).
    host.onGameListEvent("filterselect", safeHandler(SCRIPT_NAME, () => {
        openedGroupCmd = null;
    }));

    // Fires on every command; async because an action may animate the
    // wheel, so its rejections are logged too. A group command comes from
    // "Filter Tables", the only menu listing the groups.
    host.on("command", safeHandler(SCRIPT_NAME, async ev => {
        if (ev.id === filterTablesBackCmd) backFromFilterTables();
        else if (groupCmds.includes(ev.id)) openedGroupCmd = ev.id;
        const entry = entries.find(item => item.cmd === ev.id);
        if (entry) await entry.action();
    }));

    return { add, reopenOn, backFromFilterTables };
}

let sharedMainMenu = null;

// One main menu for every Add-on, so their entries are ordered together.
export function getMainMenu() {
    if (!sharedMainMenu) sharedMainMenu = createMainMenu(createPinballYHost());
    return sharedMainMenu;
}
