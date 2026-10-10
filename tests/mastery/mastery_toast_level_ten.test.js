// ============================================================
// Mastery Level 10, through main.js on the fake PinballY globals: its
// Mastery Toast brings the Confetti Shower with it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, masteryToasts, showerStarts, play, errorLines, playedFor, TABLES, MINUTE, ONE_TOAST_MS } from "./mastery_bar_scenario.js";

const [, , , NEARLY_MASTERED] = TABLES;

test("Mastery Level 10 brings the Confetti Shower with its toast", async () => {
    const fake = await startScenario({ profiles: { guest: { plays: { [NEARLY_MASTERED.configId]: playedFor(43100) } } } });
    fake.advanceTime(ONE_TOAST_MS);

    await play(fake, NEARLY_MASTERED, 2 * MINUTE);
    fake.advanceTime(ONE_TOAST_MS);

    assert.deepEqual(masteryToasts(fake), ["10 | TABLE MASTERY | Pinball Wizard (10) | Twilight Zone"]);
    assert.equal(showerStarts(fake), 1);
    assert.deepEqual(errorLines(fake), []);
});
