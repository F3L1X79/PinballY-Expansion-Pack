// ============================================================
// "Filter Tables": PinballY's filter groups leave the main menu for this
// submenu, which lists the groups still in the main menu (as Menu Cleanup
// left them) in PinballY's order, then Back. The main menu module creates
// it and hands it its entry's position and the way to reopen the main
// menu on an entry. It is shown by turning a main menu opening into it
// (ev.id and ev.items edited in "menuopen"), not with showMenu, which
// fires no "menuopen": so the Drawn Menus Add-on draws it like any other
// menu. Back and Exit go up one level at a time: from "Filter Tables" to
// the main menu on its entry, from a group menu opened from it to
// "Filter Tables" on that group. When the current filter belongs to one
// of its groups, the entry and that group are marked radio. Listens to
// "menuopen", "menuclose", "command", "attractmodestart" and the game
// list's "filterselect".
// ============================================================

import { safeHandler } from "../core/safe_handler.js";
import lang from "../core/i18n.js";
import { SEPARATOR_CMD } from "./menu_separator.js";

const SCRIPT_NAME = "FilterTables";

export const FILTER_TABLES_MENU_ID = "filter tables";
const FILTER_TABLES_ENTRY = "filterTables";

// PinballY's filter groups: the main menu command opening each group's
// menu, and that menu's id.
export const FILTER_GROUPS = Object.freeze([
    { command: "FilterByEra", menuId: "filter by era" },
    { command: "FilterByManufacturer", menuId: "filter by manuf" },
    { command: "FilterBySystem", menuId: "filter by system" },
    { command: "FilterByCategory", menuId: "filter by category" },
    { command: "FilterByRating", menuId: "filter by rating" },
    { command: "FilterByRecency", menuId: "filter by when played" },
    { command: "FilterByAdded", menuId: "filter by when added" },
]);

// The main menu module's: addMainMenuEntry adds the entry at position;
// reopenMainMenuOn(name) opens the main menu with the cursor on an entry.
export function createFilterTables(host, { addMainMenuEntry, position, reopenMainMenuOn }) {
    const groupCmds = FILTER_GROUPS.map(group => host.getBuiltInCommand(group.command));
    const groupCmdOfMenu = id => {
        const index = FILTER_GROUPS.findIndex(group => group.menuId === id);
        return index === -1 ? null : groupCmds[index];
    };
    const isGroupItem = item => groupCmds.includes(item.cmd);
    const backCmd = host.allocateCommand("filterTablesBack");
    const menuReturnCmd = host.getBuiltInCommand("MenuReturn");
    // Set when the next main menu opening shows "Filter Tables" instead:
    // { selectedCmd }, the group the cursor goes to (null for the first).
    let opening = null;
    // The group whose menu was opened from "Filter Tables", while it shows:
    // a Drawn group menu goes back by opening the main menu again, which
    // then shows "Filter Tables" on that group.
    let openedGroupCmd = null;
    // The filter groups in the last main menu opening.
    let groupsShown = [];
    // The level shown as a native menu: { id, up, chosen }. up goes one
    // level up; chosen is set once an entry other than MenuReturn is
    // picked, for the menu then closes on its own (a filter applied).
    let shownLevel = null;

    // Opens "Filter Tables" with the cursor on this group (null: the first).
    function open(selectedCmd) {
        opening = { selectedCmd };
        host.doCommand(host.getBuiltInCommand("ShowMainMenu"));
    }

    // Back out of "Filter Tables", to the main menu on its entry.
    function back() {
        reopenMainMenuOn(FILTER_TABLES_ENTRY);
    }

    // Turns this main menu opening into "Filter Tables". Its group holding
    // the current filter is marked, set on each group so a mark PinballY
    // may put on them itself is never doubled.
    function show(ev, groups, selectedCmd) {
        const activeGroupCmd = host.getCurrentFilterGroupCmd();
        ev.id = FILTER_TABLES_MENU_ID;
        ev.items = [
            ...groups.map(item => Object.assign({}, item, { selected: item.cmd === selectedCmd, radio: item.cmd === activeGroupCmd })),
            { cmd: SEPARATOR_CMD },
            { title: lang.customMenuLabels.filterTablesBack, cmd: backCmd },
        ];
        ev.menuUpdated = true;
        shownLevel = { id: FILTER_TABLES_MENU_ID, up: back, chosen: false };
    }

    // Registered before the main menu module's own listener, which then
    // sees the "Filter Tables" id and leaves it alone.
    host.on("menuopen", safeHandler(SCRIPT_NAME, ev => {
        if (ev.id === "main") {
            const groups = ev.items.filter(isGroupItem);
            const selectedCmd = opening ? opening.selectedCmd : openedGroupCmd;
            const takesOver = (opening !== null || openedGroupCmd !== null) && groups.length > 0;
            opening = null;
            openedGroupCmd = null;
            shownLevel = null;
            if (takesOver) show(ev, groups, selectedCmd);
            else groupsShown = groups;
            return;
        }
        const groupCmd = groupCmdOfMenu(ev.id);
        const fromFilterTables = groupCmd !== null && groupCmd === openedGroupCmd;
        shownLevel = fromFilterTables ? { id: ev.id, up: () => open(groupCmd), chosen: false } : null;
        if (groupCmd === null) openedGroupCmd = null;
    }));

    addMainMenuEntry({
        name: FILTER_TABLES_ENTRY,
        label: lang.customMenuLabels.filterTables,
        position,
        action: () => open(null),
        shownWhen: () => groupsShown.length > 0,
        radioWhen: () => groupsShown.some(item => item.cmd === host.getCurrentFilterGroupCmd()),
        hasSubmenu: true,
    });

    // Fires on every command; a group command comes from "Filter Tables",
    // the only menu listing the groups.
    host.on("command", safeHandler(SCRIPT_NAME, ev => {
        if (shownLevel && ev.id !== menuReturnCmd) shownLevel.chosen = true;
        if (ev.id === backCmd) back();
        else if (groupCmds.includes(ev.id)) openedGroupCmd = ev.id;
    }));

    // Fires when any menu closes, after the "menuopen" of a menu shown in
    // its place. A native level closed with nothing chosen and no menu in
    // its place was left by Exit or MenuReturn, which in PinballY only
    // close it (PinballY's group menus end with a MenuReturn entry): go
    // one level up instead. Attract mode closes the menus too.
    host.on("menuclose", safeHandler(SCRIPT_NAME, ev => {
        if (groupCmdOfMenu(ev.id) !== null) openedGroupCmd = null;
        if (!shownLevel || shownLevel.id !== ev.id) return;
        const { up, chosen } = shownLevel;
        shownLevel = null;
        if (!chosen && host.getUIMode() !== "attract") up();
    }));

    // Fires when the cabinet sits idle, closing any menu.
    host.on("attractmodestart", safeHandler(SCRIPT_NAME, () => {
        opening = null;
        openedGroupCmd = null;
        shownLevel = null;
    }));

    // Fires when the player picks a filter, which closes the menus (a Drawn
    // group menu has no "menuclose" to say so).
    host.onGameListEvent("filterselect", safeHandler(SCRIPT_NAME, () => {
        openedGroupCmd = null;
    }));

    return { isGroupItem, back };
}
