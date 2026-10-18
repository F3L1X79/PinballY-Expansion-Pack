// ============================================================
// My High Scores: a selection filter (common/tables/selection_filter.js)
// in the main menu, right under the Hall of Fame, that puts on the wheel
// the tables the active Profile can see where it holds a place on the last
// known board, best place first, then by title, each table its own
// Next/Previous Page stop. Its entry is in the main menu only while there
// are some, checked at each opening. Besides each return to the wheel, it
// runs again when a Play credits High Scores (settled after the return),
// on a Profile switch and after a Profile Reset of the active Profile.
// ============================================================

import lang from "../core/i18n.js";
import { createSelectionFilter } from "../tables/selection_filter.js";
import { safeHandler } from "../core/safe_handler.js";
import { tablesVisibleTo } from "../tables/visible_tables.js";
import { SCRIPT_NAME } from "./high_score_store.js";

// The Hall of Fame has sort key "6000" and PinballY's
// "Favorites" filter "7000" in the [Top] group.
const UNDER_HALL_OF_FAME_SORT_KEY = "6500";

export function createMyHighScores(host, { highScores, profileStore, mainMenu }) {
    const selectConfigIds = () => {
        const visible = new Map(tablesVisibleTo(host.getVisibleTables(), profileStore).map(game => [game.configId, game]));
        return highScores.placesHeldBy(profileStore.getActiveProfile().name)
            .filter(({ configId }) => visible.has(configId))
            .sort((a, b) => a.bestPlace - b.bestPlace
                || visible.get(a.configId).title.localeCompare(visible.get(b.configId).title))
            .map(({ configId }) => configId);
    };
    const { filterId, runAgainIfCurrent } = createSelectionFilter(host, {
        scriptName: SCRIPT_NAME,
        id: "project.MyHighScores",
        title: lang.customMenuLabels.myHighScoresFilter,
        group: "[Top]",
        sortKey: UNDER_HALL_OF_FAME_SORT_KEY,
        ranked: true,
        selectConfigIds,
    });
    mainMenu.showFilterWhen(filterId, () => selectConfigIds().length > 0);

    highScores.onCredited(safeHandler(SCRIPT_NAME, runAgainIfCurrent));
    profileStore.onSwitch(safeHandler(SCRIPT_NAME, runAgainIfCurrent));
    // Fires after any change of a Profile's data. The spec asks for the
    // check after a reset of the active Profile, like the Hall of Fame's;
    // its places stay its own (see the store), so it moves nothing today.
    profileStore.onUpdate(safeHandler(SCRIPT_NAME, (profileName, { isReset }) => {
        if (isReset && profileName === profileStore.getActiveProfile().name) runAgainIfCurrent();
    }));
}
