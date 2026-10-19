// ============================================================
// Adult Tables: the tables in config.adultCategory ("NSFW" by default), which
// a Child Profile never sees. installChildWheelFilter() adds a metafilter
// that hides them from the wheel while a Child Profile is active.
// - The filter runs again on each Profile switch, moving off a current Adult Table.
// ============================================================

import config from "../core/config.js";
import { safeHandler } from "../core/safe_handler.js";
import { createPinballYHost } from "../core/pinbally_host.js";
import { getProfileStore } from "../profiles/profile_store.js";

const SCRIPT_NAME = "AdultTables";
// Metafilters run in ascending priority and the last one decides: this one
// must have the last word over any other add-on's.
const CHILD_WHEEL_FILTER_PRIORITY = 100000;

export const isAdultTable = game => (game.categories || []).includes(config.adultCategory);

// Whether the named Profile (the active one by default) never sees this
// table: an Adult Table, for a Child Profile. The mark is only read for an Adult Table.
export const isKeptFromChild = (game, profileStore, profileName) =>
    isAdultTable(game) && profileStore.isChild(profileName);

function createChildWheelFilter(host, profileStore) {
    // Read once per filter run rather than once per table.
    let childIsActive = profileStore.isChild();

    host.createMetaFilter({
        priority: CHILD_WHEEL_FILTER_PRIORITY,
        // Fires each time PinballY runs the filter, before it scans the tables.
        before: safeHandler(SCRIPT_NAME, () => {
            childIsActive = profileStore.isChild();
        }),
        select: game => !childIsActive || !isAdultTable(game),
    });

    profileStore.onSwitch(safeHandler(SCRIPT_NAME, () => { host.refreshFilter(); }));
}

// Once, by main.js, whatever Add-ons are on: the rule is the household's.
export function installChildWheelFilter() {
    createChildWheelFilter(createPinballYHost(), getProfileStore());
}
