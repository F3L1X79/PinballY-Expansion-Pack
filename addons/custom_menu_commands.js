// ============================================================
// Adds "Table Setup" to the main menu through the main menu module, and
// "Reset profile" to the Exit menu. Listens to "menuopen" and "command".
// - With an Admin Profile, only Admins see "Table Setup", "Operator Menu" and "Reset profile".
// - The coin door service button still opens the Operator Menu for anyone.
// ============================================================

import { safeHandler } from "../common/core/safe_handler.js";
import { getProfileStore } from "../common/profiles/profile_store.js";
import { getMainMenu, MAIN_MENU_POSITION } from "../common/menus/main_menu.js";
import { createProfileResetMenu } from "../common/menus/profile_reset_menu.js";
import { getDrawnMenus } from "../common/drawn_menu/drawn_menu.js";
import { createPinballYHost } from "../common/core/pinbally_host.js";
import lang from "../common/core/i18n.js";

const SCRIPT_NAME = "CustomMenuCommands";

export default function init() {
    const { customMenuLabels: MENU_LABELS } = lang;
    const profileStore = getProfileStore();
    // Every Profile sees the setup entries until the household marks an Admin Profile.
    const showsSetupEntries = () => profileStore.isAdmin() || !profileStore.hasAdminProfile();

    const MENU_COMMANDS = [
        {
            name: "showTableSetup",
            label: MENU_LABELS.tableSetup,
            position: MAIN_MENU_POSITION.TABLE_SETUP,
            action: () => { mainWindow.doCommand(command.ShowGameSetupMenu); },
            shownWhen: showsSetupEntries,
        },
    ];

    const mainMenu = getMainMenu();
    for (const entry of MENU_COMMANDS) mainMenu.add(entry);

    const profileResetMenu = createProfileResetMenu(createPinballYHost(), profileStore, getDrawnMenus());
    const resetProfileCommand = command.allocate("resetProfile");

    // Fires when any menu opens, with a fresh item list each time: in the
    // Exit menu, an Admin Profile gets "Reset profile" right after the
    // Operator Menu (at the end when PinballY leaves that one out).
    mainWindow.on("menuopen", safeHandler(SCRIPT_NAME, ev => {
        if (ev.id !== "exit") return;
        if (profileStore.isAdmin()) {
            ev.addMenuItem({ after: command.ShowOperatorMenu }, { title: lang.profileReset.menuEntry, cmd: resetProfileCommand });
        } else if (!showsSetupEntries()) {
            ev.deleteMenuItem(command.ShowOperatorMenu);
            ev.tidyMenu();
        }
    }));

    // Fires on every command.
    mainWindow.on("command", safeHandler(SCRIPT_NAME, ev => {
        if (ev.id === resetProfileCommand) profileResetMenu.open();
    }));
}
