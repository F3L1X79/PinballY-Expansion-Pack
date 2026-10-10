// ============================================================
// A Child Profile's Level Toast, through main.js on the fake PinballY
// globals, in a collection with Adult Tables: its points are scaled up,
// so a Play announces a level its own points alone would not reach.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startScenario, levelToasts, play, errorLines, TABLES, ADULT_TABLES, MINUTE, ALL_TOASTS_MS, levelToastOf, pickLastTables,
} from "../mastery/mastery_bar_scenario.js";

const [FIRST] = TABLES;

test("a child's Level Toast announces the level its scaled points reach", async () => {
    pickLastTables();
    // Four Seasons, Gold 50; every Achievement is worth 1790 points to the
    // child and 2045 to a Profile that is not a child: 57 points, level 2.
    const fake = await startScenario({
        addOns: ["achievements", "profilePicker"],
        tables: [...TABLES, ...ADULT_TABLES],
        active: "Kid",
        profiles: { Kid: { isChild: true, notified: ["fourSeasons"] } },
    });
    fake.advanceTime(ALL_TOASTS_MS);
    assert.deepEqual(levelToasts(fake), []);

    // First table, Williams, 10% and 25% of the collection: 120 points of its
    // own, still level 2, scaled to 137, level 3.
    await play(fake, FIRST, 10 * MINUTE);
    fake.advanceTime(ALL_TOASTS_MS);
    assert.deepEqual(levelToasts(fake), [levelToastOf(3)]);

    assert.deepEqual(errorLines(fake), []);
});
