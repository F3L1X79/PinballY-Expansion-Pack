// ============================================================
// Drawn Menus (on by default, ADD_ON_DRAWN_MENUS): the player's menus are
// drawn in the pack's Steamball look by the Drawn Menu module instead of
// PinballY's native ones (see docs/adr/0013). Listens to "menuopen" last
// of all the Add-ons, so it sees the final entries; for one of the menus
// it draws, it hands over a copy of them and cancels the native menu only
// once drawing succeeded (preventDefault() and menuUpdated back to false),
// so the native menu shows on any error. Any
// other menu stays native, and replaces an open Drawn Menu. Exit or a
// Cancel entry in a filter submenu goes back to the menu that opened it
// (the Filter Picker for a group), the cursor on its entry; Exit in the
// Filter Picker goes back to the main menu, on its entry. A Drawn main
// menu shows the "Change Filter" entry and a footer naming the Active Filter.
// ============================================================

import { safeHandler } from "../common/core/safe_handler.js";
import lang from "../common/core/i18n.js";
import { getDrawnMenus } from "../common/drawn_menu/drawn_menu.js";
import { getMainMenu } from "../common/menus/main_menu.js";
import { FILTER_GROUPS, FILTER_PICKER_MENU_ID } from "../common/menus/filter_picker.js";

const SCRIPT_NAME = "DrawnMenus";

// The PinballY menu ids drawn instead of shown natively: the player's
// menus, the table's setup and categories menus, opened from the main
// menu, and the operator menu, from the Exit menu. The capture, media
// drop and elevation menus and the pause menu stay native.
const FILTER_MENU_IDS = FILTER_GROUPS.map(group => group.menuId);
const DRAWN_MENU_IDS = ["main", FILTER_PICKER_MENU_ID, "exit", "power off", "game setup", "game categories", "operator", ...FILTER_MENU_IDS];

export default function init() {
    const drawnMenus = getDrawnMenus();
    // Created now, for its "menuopen" listener to run before ours.
    const { filterPicker } = getMainMenu();
    const showMainMenu = command.ShowMainMenu;
    // The last command run, as the one that opened a filter submenu; and
    // the main menu's entry to put the cursor on when going back to it.
    let lastCommand = null;
    let mainMenuSelectedCmd = null;

    // Fires on every command, a menu's entries' included.
    mainWindow.on("command", safeHandler(SCRIPT_NAME, ev => {
        lastCommand = ev.id;
    }));

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
        const drawOptions = { dialogStyle: Boolean(options.dialogStyle) };
        let items = [...ev.items];
        if (FILTER_MENU_IDS.includes(ev.id)) {
            const parentCmd = lastCommand;
            drawOptions.onBack = () => {
                mainMenuSelectedCmd = parentCmd;
                mainWindow.doCommand(showMainMenu);
            };
        } else if (ev.id === FILTER_PICKER_MENU_ID) {
            // Back from a group menu lands here: the main menu module puts
            // the cursor on that group itself.
            mainMenuSelectedCmd = null;
            drawOptions.onBack = () => { filterPicker.back(); };
        } else if (ev.id === "main") {
            drawOptions.selectedCmd = mainMenuSelectedCmd;
            mainMenuSelectedCmd = null;
            const labels = lang.customMenuLabels;
            items = items.map(item => (item.cmd === filterPicker.entryCmd ? Object.assign({}, item, { title: labels.changeFilter }) : item));
            drawOptions.footer = { label: labels.activeFilterLabel, name: filterPicker.activeFilterName() };
        }
        if (!drawnMenus.draw(ev.id, items, drawOptions)) return;
        ev.preventDefault();
        // PinballY shows a menu marked updated even when "menuopen" is
        // cancelled (FireMenuEvent checks menuUpdated first), and the other
        // Add-ons' edits mark it so: the native menu would open under ours.
        ev.menuUpdated = false;
    }));
}
