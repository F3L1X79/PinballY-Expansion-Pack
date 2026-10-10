// ============================================================
// Drawn Menus (on by default, ADD_ON_DRAWN_MENUS): the player's menus are
// drawn in the pack's Steamball look by the Drawn Menu module instead of
// PinballY's native ones (see docs/adr/0013). Listens to "menuopen" last
// of all the Add-ons, so it sees the final entries; for one of the menus
// it draws, it hands over a copy of them and cancels the native menu only
// once drawing succeeded (preventDefault() and menuUpdated back to false),
// so the native menu shows on any error. Any
// other menu stays native, and replaces an open Drawn Menu.
// ============================================================

import { safeHandler } from "../common/safe_handler.js";
import { getDrawnMenus } from "../common/drawn_menu.js";

const SCRIPT_NAME = "DrawnMenus";

// The PinballY menu ids drawn instead of shown natively: the player's
// menus and the table's setup and categories menus, opened from the main
// menu. The other setup menus (operator, capture, media drop,
// elevation...) and the pause menu stay native.
const FILTER_MENU_IDS = ["category", "era", "manuf", "rating", "system", "when added", "when played"].map(name => `filter by ${name}`);
const DRAWN_MENU_IDS = ["main", "exit", "power off", "game setup", "game categories", ...FILTER_MENU_IDS];

export default function init() {
    const drawnMenus = getDrawnMenus();

    // Fires when any menu opens, after every other Add-on edited its entries.
    mainWindow.on("menuopen", safeHandler(SCRIPT_NAME, ev => {
        // As a native menu replaces another, the new menu replaces a Drawn
        // one; draw() closes it itself, seeing first whether it is the same
        // menu shown again.
        if (!DRAWN_MENU_IDS.includes(ev.id)) {
            drawnMenus.close();
            return;
        }
        const options = ev.options || {};
        if (!drawnMenus.draw(ev.id, [...ev.items], { dialogStyle: Boolean(options.dialogStyle) })) return;
        ev.preventDefault();
        // PinballY shows a menu marked updated even when "menuopen" is
        // cancelled (FireMenuEvent checks menuUpdated first), and the other
        // Add-ons' edits mark it so: the native menu would open under ours.
        ev.menuUpdated = false;
    }));
}
