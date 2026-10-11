// ============================================================
// A big Household, through main.js on the fake PinballY globals: Exit on
// the read-only Profile Stats of a column past the first five shows the
// Household Stats again with that column in view, under the halo.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold, errorLines } from "./household_stats_scenario.js";
import { cardTexts, PROFILE_STATS_OPEN_MS } from "./profile_stats_reader.js";
import { openHouseholdStats, chooseColumn, columnsInView, highlightedColumn, press, GLIDE_OVER_MS } from "./household_stats_reader.js";

const NAMES = ["Ann", "Ben", "Cat", "Dan", "Eve", "Fay", "Gus"];

test("back from a column past the first five, it is in view under the halo", async () => {
    const { fake, lang } = await startHousehold({ profiles: Object.fromEntries(NAMES.map(name => [name, {}])) });
    openHouseholdStats(fake, lang);
    chooseColumn(fake, "Gus");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.equal(cardTexts(fake)[0], "Gus");

    press(fake, "Exit");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.equal(highlightedColumn(fake), "Gus");
    assert.deepEqual(columnsInView(fake), NAMES.slice(2), "no glide: already there");

    press(fake, "Next");
    press(fake, "Next");
    fake.advanceTime(GLIDE_OVER_MS);
    assert.equal(highlightedColumn(fake), "Ann", "still looping, through the cross");
    assert.deepEqual(columnsInView(fake), NAMES.slice(0, 5));
    assert.deepEqual(errorLines(fake), []);
});
