// ============================================================
// Adds a "Tables to Discover" filter to PinballY's main menu, right before
// the Hall of Fame: the wheel then shows the tables the active Profile can
// see and never played, by title.
// Registered once at init; the selection is recomputed each time the
// filter is activated, and on a Profile switch or a Profile Reset of the
// active Profile while the filter is on the wheel.
// ============================================================

import lang from "../common/i18n.js";
import { safeHandler } from "../common/safe_handler.js";
import { getProfileStore } from "../common/profile_store.js";
import { getActiveProfileTables } from "../common/visible_tables.js";
import {
    getTablesToDiscover, TABLES_TO_DISCOVER_FILTER_ID, TABLES_TO_DISCOVER_FULL_FILTER_ID,
} from "../common/tables_to_discover.js";

const SCRIPT_NAME = "TablesToDiscover";

// Challenge Tables has sort key "5000" and the Hall of Fame "6000" in the
// [Top] group, so the Favorite Tables stay right under the Hall of Fame.
const BEFORE_HALL_OF_FAME_SORT_KEY = "5500";

export default function init() {
    const { tablesToDiscoverFilter: FILTER_TITLE } = lang.customMenuLabels;
    const profileStore = getProfileStore();

    // Position of each table in the selection, by game id. Kept after the
    // scan: PinballY sorts the wheel with it once select() is done.
    let positions = new Map();

    gameList.createFilter({
        id: TABLES_TO_DISCOVER_FILTER_ID,
        title: FILTER_TITLE,
        group: "[Top]",
        sortKey: BEFORE_HALL_OF_FAME_SORT_KEY,
        // Fires each time the filter is activated, before PinballY scans the tables.
        before: safeHandler(SCRIPT_NAME, () => {
            const tables = getTablesToDiscover(getActiveProfileTables(), profileStore);
            positions = new Map(tables.map((game, index) => [game.id, index]));
        }),
        select: game => positions.has(game.id),
        compareForSort: (a, b) => positions.get(a.id) - positions.get(b.id),
    });

    // refreshFilter() runs the filter again, so its before() reads the new
    // Profile's plays.
    const refreshIfOnWheel = () => {
        if (gameList.getCurFilter().id === TABLES_TO_DISCOVER_FULL_FILTER_ID) gameList.refreshFilter();
    };
    profileStore.onSwitch(safeHandler(SCRIPT_NAME, refreshIfOnWheel));
    // Fires after any change of a Profile's data: only the active Profile's
    // reset changes the selection on the wheel at once (a Play waits for the
    // next time the filter is shown).
    profileStore.onUpdate(safeHandler(SCRIPT_NAME, (profileName, { isReset }) => {
        if (isReset && profileName === profileStore.getActiveProfile().name) refreshIfOnWheel();
    }));
}
