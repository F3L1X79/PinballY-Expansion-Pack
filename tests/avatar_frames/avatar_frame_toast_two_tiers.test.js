// ============================================================
// A Play that raises the Collection Tier by two, through main.js on the
// fake PinballY globals: its one Mastery Toast names both Avatar Frames
// it unlocks, on one line.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startScenario, allToasts, collectionToasts, play, errorLines, playedFor, TABLES, MINUTE, ONE_TOAST_MS,
} from "../mastery/mastery_bar_scenario.js";

const [FIRST, SECOND, THIRD, FOURTH] = TABLES;

test("two Collection Tiers reached by one Play name both Avatar Frames in one toast", async () => {
    const apprentice = playedFor(30 * MINUTE);
    const fake = await startScenario({ profiles: { guest: { plays: {
        [FIRST.configId]: apprentice, [SECOND.configId]: apprentice, [THIRD.configId]: apprentice,
    } } } });
    fake.advanceTime(ONE_TOAST_MS);

    await play(fake, FOURTH, 30 * MINUTE);
    fake.advanceTime(2 * ONE_TOAST_MS);

    assert.deepEqual(collectionToasts(fake), [
        "2 | COLLECTION MASTERY | Tier 2: Apprentice | 4 tables at Apprentice or above | New frames: Enchanted Forest, Steam and Gears",
    ]);
    assert.equal(allToasts(fake).length, 2, "the table's Mastery Toast and one Collection Mastery toast");
    assert.deepEqual(errorLines(fake), []);
});
