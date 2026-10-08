// ============================================================
// The Level Toast with CONFETTI=false, through main.js on the fake PinballY
// globals: a Play that unlocks Platinums and reaches a new Player Level
// shows the Level Toast behind the Platinums' toasts, never waiting for a shower.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, playLastTable, showerStartLogs, levelToastCount, advanceUntil } from "./confetti_shower_scenario.js";

// Drawing the Fireworks ahead, and the startup toasts.
const STARTUP_MS = 30000;
// Well before the 7 s a Level Toast would wait for a shower.
const UNHELD_MS = 6000;

test("with CONFETTI=false the Level Toast never waits for a shower", async () => {
    const fake = await startScenario({ confetti: false });
    fake.advanceTime(STARTUP_MS);
    await playLastTable(fake);
    const shownAtMs = advanceUntil(fake, { stepMs: 10, maxMs: 20000 }, () => levelToastCount(fake) > 0);
    assert.notEqual(shownAtMs, null, "the Level Toast showed");
    // Behind the three Platinums' toasts, staggered.
    assert.ok(shownAtMs < UNHELD_MS, `the Level Toast waited ${shownAtMs} ms`);
    assert.equal(showerStartLogs(fake).length, 0);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
