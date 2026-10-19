// ============================================================
// Menu Cleanup (off by default): removes Help, About, Information, Flyer,
// High Scores, Instruction Card and some filter submenus from PinballY's
// native menus, for every Profile. Listens to "menuopen".
// - Leaves no doubled, leading or trailing separator.
// - PinballY's dedicated buttons still open those screens.
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
