// ============================================================
// Level Toasts, through main.js on the fake PinballY globals: a Play whose
// Achievements bring a higher Player Level shows its Achievement Toasts,
// then one Level Toast with the level's number, without a Confetti Shower;
// a Play crossing two levels brings one Level Toast, for the highest; a
// Play that reaches no new level brings none.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, levelToasts, allToasts, showerStarts, play, errorLines, TABLES, MINUTE, ALL_TOASTS_MS, levelToastOf, pickLastTables } from "./mastery_bar_scenario.js";

const [FIRST, SECOND] = TABLES;

test("a Play that crosses a level shows its Achievement Toasts, then one Level Toast", async () => {
    pickLastTables();
    const fake = await startScenario({ addOns: ["achievements"], profiles: { guest: {} } });
    fake.advanceTime(ALL_TOASTS_MS);
    assert.deepEqual(allToasts(fake), [], "nothing at startup");

    // First table, Williams, 10% and 25% of the collection: 70 points.
    await play(fake, FIRST, 10 * MINUTE);
    fake.advanceTime(ALL_TOASTS_MS);
    const toasts = allToasts(fake);
    assert.equal(toasts.length, 5);
    assert.ok(toasts.slice(0, 4).every(toast => toast.startsWith("ACHIEVEMENT UNLOCKED")));
    assert.equal(toasts[4], levelToastOf(2));
    assert.equal(showerStarts(fake), 0, "no Confetti Shower");

    // Past 10:10, which would bring Mirror Hour.
    fake.advanceTime(5 * MINUTE * 1000);
    // Another table: half the collection, 25 more points, still level 2.
    await play(fake, SECOND, 5 * MINUTE);
    fake.advanceTime(ALL_TOASTS_MS);
    assert.ok(allToasts(fake).length > 5, "new Achievement Toasts");
    assert.equal(levelToasts(fake).length, 1, "no new level, no Level Toast");

    assert.deepEqual(errorLines(fake), []);
});
