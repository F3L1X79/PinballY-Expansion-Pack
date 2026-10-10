// ============================================================
// The Mastery Bar lights up once, through main.js on the fake PinballY
// globals: back on the wheel after a Play that moved the selected table's
// bar forward, for about 1.2 s; never after a Play that left it where it
// was, nor after a game under a minute, nor again on a later wheel move.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, shownMastery, isLit, play, select, errorLines, playedFor, TABLES, MINUTE, LIT_MS } from "./mastery_bar_scenario.js";

const [NEW_TABLE, OTHER, SLOW_TABLE] = TABLES;
const WATCH = { watchLight: true };

test("the Mastery Bar lights up once after a Play that moved it forward", async () => {
    // 2.5 hours: level 5, whose steps take 3 minutes each.
    const fake = await startScenario({ profiles: { guest: { plays: { [SLOW_TABLE.configId]: playedFor(9000) } } } });
    assert.equal(isLit(fake), false, "nothing lit at startup");

    await play(fake, NEW_TABLE, MINUTE, WATCH);
    assert.equal(isLit(fake), true, "the first Play moved it to level 1");
    fake.advanceTime(LIT_MS - 1);
    assert.equal(isLit(fake), true);
    fake.advanceTime(1);
    assert.equal(isLit(fake), false, "the resting bar is back");
    assert.equal(shownMastery(fake).head, "Rookie");

    select(fake, OTHER);
    select(fake, NEW_TABLE);
    assert.equal(isLit(fake), false, "once only");

    await play(fake, NEW_TABLE, 30, WATCH);
    assert.equal(isLit(fake), false, "a game under a minute");

    select(fake, SLOW_TABLE);
    await play(fake, SLOW_TABLE, MINUTE, WATCH);
    assert.equal(shownMastery(fake).fill, 0);
    assert.equal(isLit(fake), false, "a Play that left the bar on the same step");

    await play(fake, SLOW_TABLE, 2 * MINUTE, WATCH);
    assert.equal(isLit(fake), true, "3 minutes in all: one step further");
    select(fake, OTHER);
    assert.equal(isLit(fake), false, "a wheel move puts it out");

    select(fake, NEW_TABLE);
    await play(fake, NEW_TABLE, 2 * MINUTE, WATCH);
    assert.equal(isLit(fake), true);
    fake.gameStarted(NEW_TABLE);
    assert.equal(isLit(fake), false, "a launch hides it at once");
    assert.equal(shownMastery(fake), null);
    fake.gameOver(NEW_TABLE);

    assert.deepEqual(errorLines(fake), []);
});
