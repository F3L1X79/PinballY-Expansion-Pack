// ============================================================
// Tables to Discover: the visible, configured tables a Profile never
// played, sorted by title, and the full id of the filter that puts them on
// the wheel (for the Profile Stats' button). Pure: takes the tables the Profile can
// see and the Profile store, returns the selection.
// ============================================================

import { getUnplayedTables } from "./visible_tables.js";

export const TABLES_TO_DISCOVER_FILTER_ID = "project.TablesToDiscover";
// PinballY prefixes a script filter's id.
export const TABLES_TO_DISCOVER_FULL_FILTER_ID = `User.${TABLES_TO_DISCOVER_FILTER_ID}`;

// Unconfigured tables are left out: PinballY's wheel never shows them.
export function getTablesToDiscover(profileTables, profileStore) {
    return getUnplayedTables(profileTables, profileStore)
        .filter(game => game.isConfigured)
        .sort((a, b) => a.title.localeCompare(b.title));
}
