// ============================================================
// Random Game: adds "Launch a random table" to the main menu, right under
// Play, through the main menu module; choosing it runs the shared Random
// Game, as the Welcome Screen's choice does.
// - Left out while the wheel selection has no table.
// ============================================================

import { createPinballYHost } from "../common/core/pinbally_host.js";
import { getMainMenu, MAIN_MENU_POSITION } from "../common/menus/main_menu.js";
import { getRandomGame } from "../common/tables/random_game.js";
import lang from "../common/core/i18n.js";

export default function init() {
    const host = createPinballYHost();
    const randomGame = getRandomGame();
    getMainMenu().add({
        name: "randomGame",
        label: lang.customMenuLabels.randomTable,
        position: MAIN_MENU_POSITION.RANDOM_GAME,
        action: randomGame.launch,
        shownWhen: () => host.getWheelTables().length > 0,
    });
}
