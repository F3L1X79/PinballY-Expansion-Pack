// ============================================================
// Adds a "Hall of Fame" filter to PinballY's main menu, after the
// Tables to Discover and right before the Favorite Tables: the wheel then
// shows the active Profile's Hall of Fame tables, among the tables it can
// see, in rank order, each table its own Next/Previous Page stop.
// Registered once at init; the ranking is recomputed each time the filter
// is activated, and on a Profile switch or a Profile Reset of the active
// Profile while the filter is on the wheel.
// ============================================================

import lang from "../common/i18n.js";
import { getHallOfFame, HALL_OF_FAME_FILTER_ID, HALL_OF_FAME_FULL_FILTER_ID } from "../common/hall_of_fame.js";
import { safeHandler } from "../common/safe_handler.js";
import { getProfileStore } from "../common/profile_store.js";
import { getActiveProfileTables } from "../common/visible_tables.js";

const SCRIPT_NAME = "HallOfFame";

// Tables to Discover has sort key "5500" and PinballY's "Favorites" filter
// "7000" in the [Top] group.
const BEFORE_FAVORITES_SORT_KEY = "6000";

export default function init() {
    const { hallOfFameFilter: FILTER_TITLE } = lang.customMenuLabels;
    const profileStore = getProfileStore();

    // Rank (from 1) of each Hall of Fame table, by game id. Kept after the
    // scan: PinballY sorts and pages the wheel with it once select() is done.
    let ranks = new Map();

    gameList.createFilter({
        id: HALL_OF_FAME_FILTER_ID,
        title: FILTER_TITLE,
        group: "[Top]",
        sortKey: BEFORE_FAVORITES_SORT_KEY,
        // Fires each time the filter is activated, before PinballY scans the tables.
        before: safeHandler(SCRIPT_NAME, () => {
            const hallOfFame = getHallOfFame(getActiveProfileTables(), profileStore.getPlay);
            ranks = new Map(hallOfFame.map((game, index) => [game.id, index + 1]));
        }),
        select: game => ranks.has(game.id),
        compareForSort: (a, b) => ranks.get(a.id) - ranks.get(b.id),
        // Group 0 would make the wheel skip the table, so ranks start at 1.
        pageGroup: game => ranks.get(game.id),
    });

    // refreshFilter() runs the filter again, so its before() ranks the new
    // Profile's tables.
    const refreshIfOnWheel = () => {
        if (gameList.getCurFilter().id === HALL_OF_FAME_FULL_FILTER_ID) gameList.refreshFilter();
    };
    profileStore.onSwitch(safeHandler(SCRIPT_NAME, refreshIfOnWheel));
    // Fires after any change of a Profile's data: only the active Profile's
    // reset empties its ranking at once (a game only moves it).
    profileStore.onUpdate(safeHandler(SCRIPT_NAME, (profileName, { isReset }) => {
        if (isReset && profileName === profileStore.getActiveProfile().name) refreshIfOnWheel();
    }));
}
