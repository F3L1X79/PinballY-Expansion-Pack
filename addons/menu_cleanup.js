// ============================================================
// Menu Cleanup (off by default): lightens PinballY's native menus for
// every Profile, Admin Profiles included. Listens to "menuopen" and
// removes Help and About from the Exit and Operator menus, and Information,
// Flyer, High Scores, Instruction Card and the filter submenus by system,
// last played and date added from the main menu, where a separator splits
// the remaining filter submenus from the filters. It leaves no doubled,
// leading or trailing separator. PinballY's dedicated buttons still open
// those screens.
// ============================================================

import { safeHandler } from "../common/safe_handler.js";

const SCRIPT_NAME = "MenuCleanup";

// PinballY's built-in commands removed from each menu, by menu id.
const REMOVED_COMMANDS = {
    exit: ["Help", "AboutBox"],
    operator: ["Help", "AboutBox"],
    main: ["GameInfo", "Flyer", "HighScores", "Instructions", "FilterBySystem", "FilterByRecency", "FilterByAdded"],
};

// The filter submenus, set apart from the filters above them in the main menu.
const FILTER_SUBMENU_COMMANDS = ["FilterByEra", "FilterByManufacturer", "FilterBySystem", "FilterByCategory", "FilterByRating", "FilterByRecency", "FilterByAdded"];

// Looser than PinballY's tidyMenu(), which needs title === "": the main
// menu module's separators have no title at all.
const isSeparator = item => item.cmd < 0 && !item.title;

export default function init() {
    // Fires when any menu opens, with a fresh item list each time.
    mainWindow.on("menuopen", safeHandler(SCRIPT_NAME, ev => {
        const removed = REMOVED_COMMANDS[ev.id];
        if (!removed) return;
        const removedCmds = removed.map(name => command[name]);
        const filterSubmenuCmds = FILTER_SUBMENU_COMMANDS.map(name => command[name]);
        const items = [];
        for (const item of ev.items) {
            if (removedCmds.includes(item.cmd)) continue;
            const previous = items[items.length - 1];
            const startsFilterSubmenus = filterSubmenuCmds.includes(item.cmd) && previous && !filterSubmenuCmds.includes(previous.cmd);
            if (startsFilterSubmenus && !isSeparator(previous)) items.push({ cmd: -1 });
            if (isSeparator(item) && (items.length === 0 || isSeparator(items[items.length - 1]))) continue;
            items.push(item);
        }
        if (items.length > 0 && isSeparator(items[items.length - 1])) items.pop();
        ev.items = items;
        ev.menuUpdated = true;
    }));
}
