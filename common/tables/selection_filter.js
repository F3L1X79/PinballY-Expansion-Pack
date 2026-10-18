// ============================================================
// Selection filter: a script filter putting on the wheel a list of tables
// the Add-on computes (Challenge Tables, My High Scores), selected again
// each time it runs. Listens to "wheelmode": while it is the current
// filter, it runs again only when its tables or their order changed, so
// that closing a menu does not move the wheel, and brings every table back
// once none is left. selectConfigIds gives the tables' config IDs in
// order; ranked keeps that order on the wheel, each table its own
// Next/Previous Page stop; the other fields go to createFilter() as they
// are. Returns the filter's full id, "User.<id>", and runAgainIfCurrent,
// the same check for the Add-on's own events (a Profile switch...).
// ============================================================

import { safeHandler } from "../core/safe_handler.js";
import { ALL_TABLES_FILTER } from "../core/pinbally_host.js";

export function createSelectionFilter(host, { scriptName, selectConfigIds, ranked = false, ...filter }) {
    const filterId = `User.${filter.id}`;
    // Kept after the scan, like PinballY keeps the filter's selection: the
    // position of each table, by config ID.
    let configIds = [];
    let positions = new Map();
    const sameTables = tables => tables.length === configIds.length && tables.every((configId, index) => configId === configIds[index]);
    // PinballY sorts and pages the wheel with these once select() is done.
    const rankedFields = ranked ? {
        compareForSort: (a, b) => positions.get(a.configId) - positions.get(b.configId),
        // Group 0 would make the wheel skip the table, so groups start at 1.
        pageGroup: game => positions.get(game.configId) + 1,
    } : {};

    host.createFilter({
        ...filter,
        ...rankedFields,
        // Fires each time the filter runs, before PinballY scans the tables.
        before: safeHandler(scriptName, () => {
            configIds = selectConfigIds();
            positions = new Map(configIds.map((configId, index) => [configId, index]));
        }),
        select: game => positions.has(game.configId),
    });

    const runAgainIfCurrent = () => {
        if (host.getCurrentFilterId() !== filterId) return;
        const tables = selectConfigIds();
        if (tables.length === 0) host.setCurrentFilter(ALL_TABLES_FILTER);
        else if (!sameTables(tables)) host.refreshFilter();
    };
    // Fires on each return to the wheel (after a game, a menu, a Profile switch).
    host.on("wheelmode", safeHandler(scriptName, runAgainIfCurrent));

    return { filterId, runAgainIfCurrent };
}
