// ============================================================
// With Table Mastery off in addOns, through main.js on the fake PinballY
// globals, no Mastery Bar layer is ever created, whatever the wheel and
// the Plays do, and no Mastery Toast shows.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, masteryLayers, masteryToasts, play, select, errorLines, DRAWN_AHEAD_MS, TABLES, HOUR } from "./mastery_bar_scenario.js";

test("with Table Mastery off, no Mastery Bar layer is created and no Mastery Toast shows", async () => {
    const fake = await startScenario({ addOns: ["challenges"] });

    await play(fake, TABLES[0], HOUR);
    select(fake, TABLES[1]);
    fake.advanceTime(DRAWN_AHEAD_MS);

    assert.deepEqual(masteryLayers(fake), []);
    assert.deepEqual(masteryToasts(fake), []);
    assert.deepEqual(errorLines(fake), []);
});
