// ============================================================
// A Play crossing two Player Levels at once, through main.js on the fake
// PinballY globals, brings a single Level Toast, for the highest level.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, levelToasts, play, errorLines, TABLES, HOUR, ALL_TOASTS_MS, levelToastOf, pickLastTables } from "./mastery_bar_scenario.js";

const [FIRST] = TABLES;

test("a Play crossing two levels shows one Level Toast, for the highest", async () => {
    pickLastTables();
    const fake = await startScenario({ addOns: ["achievements"], profiles: { guest: {} } });

    // The first table's 70 points and 1, 5 and 10 hours played: 155 points, level 3.
    await play(fake, FIRST, 10 * HOUR);
    fake.advanceTime(ALL_TOASTS_MS);

    assert.deepEqual(levelToasts(fake), [levelToastOf(3)]);
    assert.deepEqual(errorLines(fake), []);
});
