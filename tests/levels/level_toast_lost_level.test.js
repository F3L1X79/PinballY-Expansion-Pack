// ============================================================
// A Player Level lost then won back is announced again, through main.js on
// the fake PinballY globals: the Challenges Add-on turned off takes its
// Achievements' points away, and the Play that brings the level back
// shows its Level Toast.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, levelToasts, play, errorLines, TABLES, MINUTE, ALL_TOASTS_MS, levelToastOf, pickLastTables } from "../mastery/mastery_bar_scenario.js";
import config from "../../common/config.js";

const [FIRST] = TABLES;

test("a level lost when an Add-on is turned off, then won back, is announced again", async () => {
    pickLastTables();
    // A Platinum Challenge Achievement: 100 points, level 2.
    const fake = await startScenario({
        addOns: ["achievements", "challenges"],
        profiles: { guest: { notified: ["challengesCompleted:100"] } },
    });
    fake.advanceTime(ALL_TOASTS_MS);
    assert.deepEqual(levelToasts(fake), []);

    // Back to level 1: its Achievements are gone.
    config.addOns.challenges = false;
    // First table, Williams, 10% and 25% of the collection: 70 points, level 2 again.
    await play(fake, FIRST, 10 * MINUTE);
    fake.advanceTime(ALL_TOASTS_MS);
    assert.deepEqual(levelToasts(fake), [levelToastOf(2)]);

    assert.deepEqual(errorLines(fake), []);
});
