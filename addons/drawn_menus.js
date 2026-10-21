// ============================================================
// Drawn Menus (on by default): draws the player's menus in the Steamball
// look through the Drawn Menu module instead of PinballY's native ones
// (see docs/adr/0013). Listens to "menuopen".
// - Listens last of all the Add-ons, so it sees the final entries.
// - Cancels the native menu only once drawing succeeded: any error shows the native one.
// - Never cancels the pause menu: drawn over it kept open, Exit resumes the game.
// - Any other menu stays native and replaces an open Drawn Menu.
// ============================================================

import { safeHandler } from "../common/core/safe_handler.js";
import lang from "../common/core/i18n.js";
import { getDrawnMenus } from "../common/drawn_menu/drawn_menu.js";
import { getMainMenu } from "../common/menus/main_menu.js";
import { FILTER_GROUPS, FILTER_PICKER_MENU_ID } from "../common/menus/filter_picker.js";

const SCRIPT_NAME = "DrawnMenus";

// The PinballY menu ids drawn instead of shown natively: the player's
// menus, the table's setup and categories menus, opened from the main
// menu, the operator menu, from the Exit menu, and the pause menu of a
// running game. The capture, media drop and elevation menus stay native.
const FILTER_MENU_IDS = FILTER_GROUPS.map(group => group.menuId);
const PAUSE_MENU_ID = "pause game";
const DRAWN_MENU_IDS = ["main", FILTER_PICKER_MENU_ID, "exit", "power off", "game setup", "game categories", "operator", PAUSE_MENU_ID, ...FILTER_MENU_IDS];

export default function init() {
    const drawnMenus = getDrawnMenus();
    // Created now, for its "menuopen" listener to run before ours.
    const { filterPicker } = getMainMenu();
    const showMainMenu = command.ShowMainMenu;
    const resumeGame = command.ResumeGame;
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
        if (ev.id === PAUSE_MENU_ID) {
            // Never cancelled, drawn or not: cancelled, PinballY hands the
            // focus back to the game and the Drawn Menu hears nothing.
            drawnMenus.draw(ev.id, items, { ...drawOptions, keepNative: { exitCmd: resumeGame } });
            return;
        }
        if (!drawnMenus.draw(ev.id, items, drawOptions)) return;
        ev.preventDefault();
        // PinballY shows a menu marked updated even when "menuopen" is
        // cancelled (FireMenuEvent checks menuUpdated first), and the other
        // Add-ons' edits mark it so: the native menu would open under ours.
        ev.menuUpdated = false;
    }));
}
