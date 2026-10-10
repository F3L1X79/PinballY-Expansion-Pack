// ============================================================
// The Household Stats without the Table Mastery and Challenges Add-ons,
// through main.js on the fake PinballY globals: the Collection Mastery and
// completed Challenges lines go away with them.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold, errorLines } from "./household_stats_scenario.js";
import { openHouseholdStats, labels } from "./household_stats_reader.js";

test("the Collection Mastery and completed Challenges lines leave with their Add-on", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {} }, active: "Alice", addOns: ["achievements"] });
    openHouseholdStats(fake, lang);

    assert.deepEqual(labels(fake), ["Player Level", "Achievements unlocked", "Games played", "Total time", "Daily Streak"]);
    assert.deepEqual(errorLines(fake), []);
});
