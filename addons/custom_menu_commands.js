// ============================================================
// Adds the launch section entries (table setup, table of the day, table of
// the week, random table) to PinballY's main menu through the main menu
// module, which places them right after "Play" and runs the matching action
// when one is selected. A Child Profile does not get a Period Table's
// entry while it is an Adult Table. Once the household has an Admin
// Profile, only the Admin Profiles see "Table Setup" there and PinballY's
// "Operator Menu" in the Exit menu (listens to "menuopen" and "command");
// the coin door service button still opens the Operator Menu for anyone.
// An Admin Profile also gets "Reset profile" there, which opens the
// Profile Reset menus.
// ============================================================

import { safeHandler } from "../common/safe_handler.js";
import { getProfileStore } from "../common/profile_store.js";
import { getRandomGame } from "../common/random_game.js";
import { getTableOfTheDay, getTableOfTheWeek } from "../common/period_table.js";
import { getMainMenu, MAIN_MENU_POSITION } from "../common/main_menu.js";
import { createProfileResetMenu } from "../common/profile_reset_menu.js";
import { getDrawnMenus } from "../common/drawn_menu.js";
import { createPinballYHost } from "../common/pinbally_host.js";
import lang from "../common/i18n.js";

const SCRIPT_NAME = "CustomMenuCommands";

export default function init() {
    const { customMenuLabels: MENU_LABELS } = lang;
    const tableOfTheDay = getTableOfTheDay();
    const tableOfTheWeek = getTableOfTheWeek();
    const randomGame = getRandomGame();
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
        { name: "RandomGameStart", label: MENU_LABELS.randomGame, position: MAIN_MENU_POSITION.RANDOM_GAME, action: randomGame.launch },
        { name: "tableOfTheDay", label: MENU_LABELS.tableOfTheDay, position: MAIN_MENU_POSITION.TABLE_OF_THE_DAY, action: tableOfTheDay.launch, shownWhen: tableOfTheDay.isOffered },
        { name: "tableOfTheWeek", label: MENU_LABELS.tableOfTheWeek, position: MAIN_MENU_POSITION.TABLE_OF_THE_WEEK, action: tableOfTheWeek.launch, shownWhen: tableOfTheWeek.isOffered },
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
