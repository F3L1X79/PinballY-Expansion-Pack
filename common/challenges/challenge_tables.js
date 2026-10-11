// ============================================================
// Challenge Tables: a script filter in the main menu, right under "All
// Tables", that puts on the wheel the tables that would move the active
// Profile's Challenge forward (see common/challenges/challenge.js); they are selected
// again each time it runs. Listens to "wheelmode": while the filter is
// shown, a table that counted leaves the wheel, and every table comes back
// once none is left (or when there was none to begin with).
// ============================================================

import { safeHandler } from "../core/safe_handler.js";
import lang from "../core/i18n.js";
import { ALL_TABLES_FILTER } from "../core/pinbally_host.js";

const SCRIPT_NAME = "ChallengeTables";
const FILTER_ID = "project.ChallengeTables";
// PinballY prefixes a script filter's id.
const FULL_FILTER_ID = `User.${FILTER_ID}`;
// PinballY's "All Tables" has sort key "3000" and the Hall of Fame "6000" in the [Top] group.
const UNDER_ALL_TABLES_SORT_KEY = "5000";

export function createChallengeTables(host, challenges) {
    const { challengeTables: title } = lang.customMenuLabels;
    // Kept after the scan, like PinballY keeps the filter's selection.
    let configIds = new Set();
    const selectTables = () => new Set(challenges.getTablesToPlay().map(table => table.configId));
    const sameTables = tables => tables.size === configIds.size && [...tables].every(configId => configIds.has(configId));

    host.createFilter({
        id: FILTER_ID,
        title,
        group: "[Top]",
        sortKey: UNDER_ALL_TABLES_SORT_KEY,
        // Fires each time the filter runs, before PinballY scans the tables.
        before: safeHandler(SCRIPT_NAME, () => {
            configIds = selectTables();
        }),
        select: game => configIds.has(game.configId),
    });

    // Fires on each return to the wheel (after a game, a menu, a Profile
    // switch). The filter only runs again when its tables changed, so that
    // closing a menu doesn't move the wheel back to its first table.
    host.on("wheelmode", safeHandler(SCRIPT_NAME, () => {
        if (host.getCurrentFilterId() !== FULL_FILTER_ID) return;
        const tables = selectTables();
        if (tables.size === 0) host.setCurrentFilter(ALL_TABLES_FILTER);
        else if (!sameTables(tables)) host.refreshFilter();
    }));
}
