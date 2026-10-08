// ============================================================
// The Level Toast after a Confetti Shower, through main.js on the fake
// PinballY globals: a Play that unlocks Platinums and reaches a new Player
// Level starts the confetti with the first Platinum's toast, then the Level
// Toast and the Fireworks a second before the shower's nominal end, not
// earlier.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, playLastTable, showerStartLogs, levelToastCount, msFromShowerToLevelToast } from "./confetti_shower_scenario.js";
import { fireworksStartLogs } from "./fireworks_reader.js";

// Drawing the confetti and the Fireworks ahead, and the startup toasts.
const STARTUP_MS = 30000;
const STEP_MS = 10;
// A second before the shower's nominal end, 8 s from its start.
const LEVEL_TOAST_MS = 7000;

test("a Play bringing Platinums and a new level shows the Level Toast and the Fireworks a second before the shower ends", async () => {
    const fake = await startScenario();
    fake.advanceTime(STARTUP_MS);
    assert.equal(showerStartLogs(fake).length, 0, "no shower at startup");
    assert.equal(levelToastCount(fake), 0, "no Level Toast at startup");

    await playLastTable(fake);
    const fromShowerMs = msFromShowerToLevelToast(fake, { stepMs: STEP_MS, maxMs: 20000 });
    assert.notEqual(fromShowerMs, null, "the Level Toast showed");
    assert.ok(fromShowerMs >= LEVEL_TOAST_MS && fromShowerMs <= LEVEL_TOAST_MS + 100,
        `the Level Toast starts a second before the shower's end, not ${fromShowerMs} ms after its start`);
    assert.equal(fireworksStartLogs(fake).length, 1, "the Fireworks start with the Level Toast");
    assert.equal(showerStartLogs(fake).length, 1);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
