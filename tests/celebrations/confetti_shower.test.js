// ============================================================
// The Confetti Shower, through main.js on the fake PinballY globals: no
// confetti for the Gold Achievements announced at startup, none while a
// game runs, then a single shower in front of everything with the toasts
// of the three Platinum Achievements the game unlocked, gone after about
// 8 s with no frame timer left running, never on the backglass, and with
// no sound while CONFETTI_SOUND_FILE is empty.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { toastDrawings } from "../achievements/achievement_toast_reader.js";
import { ACHIEVEMENT_TOAST_Z_INDEX } from "../../common/achievement_toast.js";
import {
    startScenario, playLastTable, advanceUntil, confettiLayers, visibleConfettiCount, showerStartLogs,
} from "./confetti_shower_scenario.js";

// About 8 s, plus a margin.
const SHOWER_MAX_MS = 10000;
// Longer than every toast of a batch, rise, hold and fade.
const ALL_TOASTS_MS = 30000;

test("a Platinum Achievement's toast brings a single Confetti Shower, gone after about 8 s", async () => {
    const fake = await startScenario();

    // The startup toasts (Gold at most) come and go; the confetti are drawn ahead meanwhile.
    advanceUntil(fake, { stepMs: 50, maxMs: ALL_TOASTS_MS }, () => {
        assert.equal(visibleConfettiCount(fake), 0, "no confetti for a Gold Achievement");
        return false;
    });
    assert.ok(toastDrawings(fake).length > 0, "the startup toasts showed");
    assert.ok(confettiLayers(fake).length > 0, "the confetti were drawn ahead");
    assert.ok(confettiLayers(fake).every(layer => layer.zIndex > ACHIEVEMENT_TOAST_Z_INDEX),
        "in front of the toasts");
    const startupToastCount = toastDrawings(fake).length;

    await playLastTable(fake, () => {
        assert.equal(visibleConfettiCount(fake), 0, "no confetti while a game runs");
    });

    const firstVisibleMs = advanceUntil(fake, { stepMs: 10, maxMs: 3000 }, () => visibleConfettiCount(fake) > 0);
    assert.notEqual(firstVisibleMs, null, "confetti come with the Platinum toast after the game");

    let lastVisibleMs = firstVisibleMs;
    advanceUntil(fake, { stepMs: 50, maxMs: ALL_TOASTS_MS }, elapsedMs => {
        if (visibleConfettiCount(fake) > 0) lastVisibleMs = firstVisibleMs + elapsedMs;
        return false;
    });
    assert.ok(lastVisibleMs - firstVisibleMs < SHOWER_MAX_MS,
        `the shower lasts about 8 s, not ${lastVisibleMs - firstVisibleMs} ms`);
    assert.equal(visibleConfettiCount(fake), 0, "every confetto hidden again");
    assert.equal(fake.runningIntervalCount(), 0, "no frame timer left running");

    assert.ok(toastDrawings(fake).length - startupToastCount >= 3, "the three Platinum toasts showed");
    assert.equal(showerStartLogs(fake).length, 1, "one shower for several Platinum toasts");
    assert.deepEqual(fake.soundsPlayed(), [], "no sound with an empty CONFETTI_SOUND_FILE");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), [],
        "no error, so no draw on the backglass, which the fake host does not offer");
});
