// ============================================================
// A Profile Reset starts the Player Level over, through main.js on the
// fake PinballY globals: the reset announces nothing, a Level Toast still
// waiting is dropped, and the next level reached is announced again.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, levelToasts, play, errorLines, TABLES, MINUTE, ALL_TOASTS_MS, levelToastOf, pickLastTables } from "../mastery/mastery_bar_scenario.js";

const [FIRST] = TABLES;

test("after a Profile Reset, the level is announced again once reached again", async () => {
    pickLastTables();
    const fake = await startScenario({ addOns: ["achievements"], profiles: { guest: {} } });
    const { getProfileStore } = await import("../../common/profile_store.js");

    // The Play is announced while the game exits: its toasts wait for the wheel.
    fake.playGame(FIRST);
    fake.gameStarted(FIRST);
    fake.advanceTime(10 * MINUTE * 1000);
    fake.fire("gameover", { game: FIRST });
    getProfileStore().resetProfile("guest");
    fake.gameOver(FIRST);
    fake.advanceTime(ALL_TOASTS_MS);
    assert.deepEqual(levelToasts(fake), [], "the waiting Level Toast is dropped");

    // Past 10:10, which would bring Mirror Hour.
    fake.advanceTime(5 * MINUTE * 1000);
    await play(fake, FIRST, 10 * MINUTE);
    fake.advanceTime(ALL_TOASTS_MS);
    assert.deepEqual(levelToasts(fake), [levelToastOf(2)]);

    assert.deepEqual(errorLines(fake), []);
});
