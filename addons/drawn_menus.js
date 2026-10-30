// ============================================================
// Drawn Menus (on by default): draws every menu, PinballY's or a script's,
// in the Steamball look through the Drawn Menu module instead of the native
// one, except the media drop menus and "confirm delete media" (see
// docs/adr/0013). Listens to "menuopen".
// - Listens last of all the Add-ons, so it sees the final entries.
// - Cancels the native menu only once drawing succeeded: any error shows the native one.
// - Never cancels the pause menu: drawn over it kept open, Exit resumes the game.
// - Leaves native the pause menu during a media capture and a pack menu the module fell back on.
// - A menu left native replaces an open Drawn Menu.
// ============================================================

import { safeHandler } from "../common/core/safe_handler.js";
import lang from "../common/core/i18n.js";
import { getDrawnMenus } from "../common/drawn_menu/drawn_menu.js";
import { getMainMenu } from "../common/menus/main_menu.js";
import { FILTER_GROUPS, FILTER_PICKER_MENU_ID } from "../common/menus/filter_picker.js";

const SCRIPT_NAME = "DrawnMenus";

// The menus left native: the media drop menus, made for the mouse on a PC,
// and the deletion of a media file, asked over the native media list.
const isNativeMenuId = id => id.startsWith("media drop") || id === "confirm delete media";
const FILTER_MENU_IDS = FILTER_GROUPS.map(group => group.menuId);
const PAUSE_MENU_ID = "pause game";

// TEMP #372: diagnostic of the pause menu held open during a game, to
// remove once the cabinet's log has answered. Timed to the millisecond.
function tempLog(text) {
    const now = new Date();
    const time = `${now.toTimeString().slice(0, 8)}.${String(now.getMilliseconds()).padStart(3, "0")}`;
    const ui = mainWindow.getUIMode();
    logfile.log(`[TEMP #372 ${SCRIPT_NAME}] ${time} ${text} (mode ${ui.mode}, runMode ${ui.runMode}, menuID ${ui.menuID}, capture ${ui.capture})`);
}

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
        // TEMP #372
        if ([command.PauseGame, resumeGame, command.KillGame].includes(ev.id)) tempLog(`command ${ev.id}`);
    }));

    // TEMP #372: the game's steps, the pause menu's closes, and the presses
    // PinballY hears in the foreground during a game (Start while loading).
    for (const name of ["prelaunch", "gamestarted", "gameover", "postlaunch"]) {
        mainWindow.on(name, safeHandler(SCRIPT_NAME, () => tempLog(name)));
    }
    mainWindow.on("menuclose", safeHandler(SCRIPT_NAME, ev => {
        if (ev.id === PAUSE_MENU_ID) tempLog(`menuclose "${ev.id}", Drawn Menu still open: ${drawnMenus.isOpen()}`);
    }));
    mainWindow.on("commandbuttondown", safeHandler(SCRIPT_NAME, ev => {
        if (mainWindow.getUIMode().runMode) tempLog(`commandbuttondown "${ev.command}" in the foreground`);
    }));

    // Fires when any menu opens, after every other Add-on edited its entries.
    mainWindow.on("menuopen", safeHandler(SCRIPT_NAME, ev => {
        // TEMP #372
        if (ev.id === PAUSE_MENU_ID) tempLog(`menuopen "${ev.id}", Drawn Menu already open: ${drawnMenus.isOpen()}`);
        // As a native menu replaces another, the new menu replaces a Drawn
        // one; draw() closes it itself, seeing first whether it is the same
        // menu shown again. A pack menu shown natively by the module stays
        // so: cancelled, its "menuclose", which the module waits for, never comes.
        if (isNativeMenuId(ev.id) || drawnMenus.isShownNatively(ev.id)) {
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
            // A capture opens it on its own (docs/adr/0013): native, so that
            // no black cover lands in the media or stays after the capture.
            if (mainWindow.getUIMode().capture) {
                drawnMenus.close();
                return;
            }
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
