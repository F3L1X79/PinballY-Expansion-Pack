// ============================================================
// Adult Tables: the tables in the category set aside for adults
// (config.adultCategory, "NSFW" by default, matched exactly like
// PinballY's category tags), which a Child Profile never sees.
// installChildWheelFilter() puts a PinballY metafilter on top of every
// filter, leaving the Adult Tables off the wheel (and so out of the Random
// Game) while a Child Profile is active; it listens to the Profile
// switches to run the filter again at once, which also moves the wheel off
// an Adult Table that was current.
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
