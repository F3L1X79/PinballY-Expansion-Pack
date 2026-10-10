// ============================================================
// Menu Cleanup (off by default): lightens PinballY's native menus for
// every Profile, Admin Profiles included. Listens to "menuopen" and
// removes Help and About from the Exit menu, and Information, Flyer, High
// Scores, Instruction Card and the filter submenus by system, last played
// and date added from the main menu, leaving no doubled, leading or
// trailing separator. PinballY's dedicated buttons still open those
// screens.
// ============================================================

import { safeHandler } from "../common/safe_handler.js";

const SCRIPT_NAME = "MenuCleanup";

// PinballY's built-in commands removed from each menu, by menu id.
const REMOVED_COMMANDS = {
    exit: ["Help", "AboutBox"],
    main: ["GameInfo", "Flyer", "HighScores", "Instructions", "FilterBySystem", "FilterByRecency", "FilterByAdded"],
};

// Looser than PinballY's tidyMenu(), which needs title === "": the main
// menu module's separators have no title at all.
const isSeparator = item => item.cmd < 0 && !item.title;

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
