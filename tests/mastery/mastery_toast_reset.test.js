// ============================================================
// A Mastery Toast still waiting when its Profile is reset is dropped,
// through main.js on the fake PinballY globals: the Play it announced was
// erased.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, masteryToasts, errorLines, TABLES, MINUTE, ONE_TOAST_MS } from "./mastery_bar_scenario.js";

const [TABLE] = TABLES;

test("a Mastery Toast still waiting when its Profile is reset is dropped", async () => {
    const fake = await startScenario();
    const { getProfileStore } = await import("../../common/profile_store.js");

    fake.playGame(TABLE);
    fake.gameStarted(TABLE);
    fake.advanceTime(MINUTE * 1000);
    // The Play is announced while the game exits: its toast waits for the wheel.
    fake.fire("gameover", { game: TABLE });
    getProfileStore().resetProfile("guest");
    fake.gameOver(TABLE);
    fake.advanceTime(ONE_TOAST_MS);

    assert.deepEqual(masteryToasts(fake), []);
    assert.deepEqual(errorLines(fake), []);
});
