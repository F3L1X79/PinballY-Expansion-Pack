// ============================================================
// The Household Stats without the Table Mastery, Challenges and High
// Scores Add-ons, through main.js on the fake PinballY globals: the
// Collection Mastery, completed Challenges and Table Records held lines go
// away with them, and the Profile Stats' High Scores lines too.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold, errorLines } from "./household_stats_scenario.js";
import { openHouseholdStats, labels } from "./household_stats_reader.js";
import { openProfileStats, section, press } from "./profile_stats_reader.js";

test("the Collection Mastery, completed Challenges and Table Records held lines leave with their Add-on", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {} }, active: "Alice", addOns: ["achievements"] });
    const TEXT = lang.profileStats;
    openProfileStats(fake, lang);
    assert.deepEqual(Object.keys(section(fake, TEXT.sections.progression, TEXT.stats)),
        [TEXT.stats.collection, TEXT.stats.cabinetStreak, TEXT.stats.dayStreak, TEXT.stats.weekStreak]);
    press(fake, "Exit");
    openHouseholdStats(fake, lang);

    assert.deepEqual(labels(fake), ["Player Level", "Achievements unlocked", "Games played", "Total time", "Daily Streak"]);
    assert.deepEqual(errorLines(fake), []);
});
