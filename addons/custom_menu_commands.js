// ============================================================
// Adds the launch entries (Table of the Day, Table of the Week, Random Game)
// and "Table Setup" to the main menu through the main menu module.
// Listens to "menuopen" and "command".
// - A Child Profile gets no Period Table entry while it is an Adult Table.
// - With an Admin Profile, only Admins see "Table Setup", "Operator Menu" and "Reset profile".
// - The coin door service button still opens the Operator Menu for anyone.
// ============================================================

import { safeHandler } from "../common/core/safe_handler.js";
import { getProfileStore } from "../common/profiles/profile_store.js";
import { getRandomGame } from "../common/tables/random_game.js";
import { getTableOfTheDay, getTableOfTheWeek } from "../common/tables/period_table.js";
import { getMainMenu, MAIN_MENU_POSITION } from "../common/menus/main_menu.js";
import { createProfileResetMenu } from "../common/menus/profile_reset_menu.js";
import { getDrawnMenus } from "../common/drawn_menu/drawn_menu.js";
import { createPinballYHost } from "../common/core/pinbally_host.js";
import lang from "../common/core/i18n.js";

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
