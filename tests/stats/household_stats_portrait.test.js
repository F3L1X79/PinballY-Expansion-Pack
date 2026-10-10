// ============================================================
// A big Household in a portrait window, through main.js on the fake
// PinballY globals: the Household Stats show fewer columns rather than
// shrinking them, the gold halo always in view.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold, errorLines } from "./household_stats_scenario.js";
import { openHouseholdStats, columnsInView, highlightedColumn, press, GLIDE_OVER_MS } from "./household_stats_reader.js";

const NAMES = ["Ann", "Ben", "Cat", "Dan", "Eve", "Fay", "Gus"];

test("a portrait window shows fewer columns, the halo always in view", async () => {
    const { fake, lang } = await startHousehold({ profiles: Object.fromEntries(NAMES.map(name => [name, {}])) });
    fake.setLayoutSize({ width: 1080, height: 1920 });
    openHouseholdStats(fake, lang);

    const shownAtOnce = columnsInView(fake).length;
    assert.ok(shownAtOnce >= 2 && shownAtOnce < 5, `${shownAtOnce} columns in a portrait window`);
    for (let move = 0; move < NAMES.length + 1; move++) {
        press(fake, "Next");
        fake.advanceTime(GLIDE_OVER_MS);
        assert.ok(columnsInView(fake).includes(highlightedColumn(fake)), `Next ${move + 1}: the halo's column is in view`);
        assert.equal(columnsInView(fake).length, shownAtOnce);
    }
    assert.deepEqual(errorLines(fake), []);
});
