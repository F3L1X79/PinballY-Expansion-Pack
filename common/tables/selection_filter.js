// ============================================================
// Selection filter: a script filter putting on the wheel a list of tables
// the Add-on computes (Challenge Tables first), selected again each time
// it runs. Listens to "wheelmode": while it is the current filter, it
// runs again only when its tables or their order changed, so that closing
// a menu does not move the wheel, and brings every table back once none
// is left. selectConfigIds gives the tables' config IDs in order; the
// other fields go to createFilter() as they are.
// ============================================================

import { safeHandler } from "../core/safe_handler.js";
import { ALL_TABLES_FILTER } from "../core/pinbally_host.js";

// Returns the filter's full id, "User.<id>".
export function createSelectionFilter(host, { scriptName, selectConfigIds, ...filter }) {
    const filterId = `User.${filter.id}`;
    // Kept after the scan, like PinballY keeps the filter's selection.
    let configIds = [];
    let selected = new Set();
    const sameTables = tables => tables.length === configIds.length && tables.every((configId, index) => configId === configIds[index]);

    host.createFilter({
        ...filter,
        // Fires each time the filter runs, before PinballY scans the tables.
        before: safeHandler(scriptName, () => {
            configIds = selectConfigIds();
            selected = new Set(configIds);
        }),
        select: game => selected.has(game.configId),
    });

    // Fires on each return to the wheel (after a game, a menu, a Profile switch).
    host.on("wheelmode", safeHandler(scriptName, () => {
        if (host.getCurrentFilterId() !== filterId) return;
        const tables = selectConfigIds();
        if (tables.length === 0) host.setCurrentFilter(ALL_TABLES_FILTER);
        else if (!sameTables(tables)) host.refreshFilter();
    }));

    return filterId;
}
