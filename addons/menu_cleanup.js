// ============================================================
// Menu Cleanup (off by default): lightens PinballY's native menus for
// every Profile, Admin Profiles included. Listens to "menuopen" and
// removes Help and About from the Exit and Operator menus, and Information,
// Flyer, High Scores, Instruction Card and the filter submenus by system,
// last played and date added from the main menu (so they stay out of the
// main menu module's "Filter Tables" too). It leaves no doubled, leading
// or trailing separator. PinballY's dedicated buttons still open
// those screens (the HighScores one opens the High Score Board while the
// High Scores Add-on is on).
// ============================================================

import { safeHandler } from "../common/core/safe_handler.js";
import { isSeparator } from "../common/menus/menu_separator.js";

const SCRIPT_NAME = "MenuCleanup";

// PinballY's built-in commands removed from each menu, by menu id.
const REMOVED_COMMANDS = {
    exit: ["Help", "AboutBox"],
    operator: ["Help", "AboutBox"],
    main: ["GameInfo", "Flyer", "HighScores", "Instructions", "FilterBySystem", "FilterByRecency", "FilterByAdded"],
};

export default function init() {
    // Fires when any menu opens, with a fresh item list each time.
    mainWindow.on("menuopen", safeHandler(SCRIPT_NAME, ev => {
        const removed = REMOVED_COMMANDS[ev.id];
        if (!removed) return;
        const removedCmds = removed.map(name => command[name]);
        const items = [];
        for (const item of ev.items) {
            if (removedCmds.includes(item.cmd)) continue;
            if (isSeparator(item) && (items.length === 0 || isSeparator(items[items.length - 1]))) continue;
            items.push(item);
        }
        if (items.length > 0 && isSeparator(items[items.length - 1])) items.pop();
        ev.items = items;
        ev.menuUpdated = true;
    }));
}
