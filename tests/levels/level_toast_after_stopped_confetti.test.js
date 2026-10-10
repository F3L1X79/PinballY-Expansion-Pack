// ============================================================
// The Level Toast after a Confetti Shower stopped early, through main.js on
// the fake PinballY globals: a Play that unlocks Platinums and reaches a new
// Player Level starts the confetti; attract mode makes them vanish and
// releases the waiting Level Toast at once.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { startScenario, playLastTable, advanceUntil, showerStartLogs, levelToastCount } from "../celebrations/confetti_shower_scenario.js";

// Drawing the confetti and the Fireworks ahead, and the startup toasts.
const STARTUP_MS = 30000;
// Once the Platinums' toasts have left, before the Level Toast's turn at 7 s:
// nothing else would show it.
const STOP_AFTER_MS = 5500;

test("a shower vanishing on attract mode releases the Level Toast at once", async () => {
    const fake = await startScenario();
    fake.advanceTime(STARTUP_MS);
    await playLastTable(fake);
    const showerAtMs = advanceUntil(fake, { stepMs: 10, maxMs: 10000 }, () => showerStartLogs(fake).length > 0);
    assert.notEqual(showerAtMs, null, "the shower fell");
    fake.advanceTime(STOP_AFTER_MS);
    assert.equal(levelToastCount(fake), 0, "the Level Toast waits for the shower");

    fake.enterAttractMode();
    await settle();
    assert.equal(levelToastCount(fake), 1, "the Level Toast shows as the shower vanishes");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
