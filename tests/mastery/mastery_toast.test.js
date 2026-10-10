// ============================================================
// Mastery Toasts, through main.js on the fake PinballY globals: a Play
// that reaches a new Mastery Level brings one toast, back on the wheel,
// for the highest level reached, with its name, number and the table;
// none at startup for earlier levels, none for a Play that reaches no new
// level or a game under a minute, and no confetti below level 10.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, masteryToasts, showerStarts, play, errorLines, playedFor, TABLES, MINUTE, ONE_TOAST_MS } from "./mastery_bar_scenario.js";

const [NEW_TABLE, ALMOST_TWO, LEVEL_FIVE, UNPLAYED] = TABLES;

test("a Play that reaches a new Mastery Level brings one Mastery Toast for the highest level", async () => {
    const fake = await startScenario({
        profiles: { guest: { plays: { [ALMOST_TWO.configId]: playedFor(1700), [LEVEL_FIVE.configId]: playedFor(9000) } } },
    });
    fake.advanceTime(ONE_TOAST_MS);
    assert.deepEqual(masteryToasts(fake), [], "no toast at startup for earlier levels");

    fake.playGame(NEW_TABLE);
    fake.gameStarted(NEW_TABLE);
    fake.advanceTime(MINUTE * 1000);
    fake.fire("gameover", { game: NEW_TABLE });
    assert.deepEqual(masteryToasts(fake), [], "not while the game exits");
    fake.gameOver(NEW_TABLE);
    fake.advanceTime(ONE_TOAST_MS);
    assert.deepEqual(masteryToasts(fake), ["1 | TABLE MASTERY | Rookie (1) | Medieval Madness"], "back on the wheel");

    // 1700 + 2000 seconds: past level 2 (1800) and level 3 (3600).
    await play(fake, ALMOST_TWO, 2000);
    fake.advanceTime(ONE_TOAST_MS);
    assert.deepEqual(masteryToasts(fake).slice(1), ["3 | TABLE MASTERY | Regular (3) | Attack from Mars"], "one toast, the higher level");

    await play(fake, LEVEL_FIVE, 10 * MINUTE);
    await play(fake, UNPLAYED, 30);
    fake.advanceTime(ONE_TOAST_MS);
    assert.equal(masteryToasts(fake).length, 2, "no new level, no toast");
    assert.equal(showerStarts(fake), 0, "no confetti below level 10");

    assert.deepEqual(errorLines(fake), []);
});
