// ============================================================
// CONFETTI=false, through main.js on the fake PinballY globals: the toasts
// of the Platinum Achievements still show, but no confetti layer is ever
// prepared or drawn, and CONFETTI_SOUND_FILE never plays.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { toastDrawings } from "../achievements/achievement_toast_reader.js";
import { startScenario, playLastTable, confettiLayers, ALL_TOASTS_MS } from "./confetti_shower_scenario.js";

const CONFETTI_SOUND_FILE = "C:\\Sounds\\cheers.wav";

test("CONFETTI=false: the Platinum toasts show, with no confetti layer and no confetti sound", async () => {
    const fake = await startScenario({
        confetti: false, confettiSoundFile: CONFETTI_SOUND_FILE, soundFiles: [CONFETTI_SOUND_FILE],
    });
    fake.advanceTime(ALL_TOASTS_MS);
    const startupToastCount = toastDrawings(fake).length;

    await playLastTable(fake);
    fake.advanceTime(ALL_TOASTS_MS);

    assert.ok(toastDrawings(fake).length - startupToastCount >= 3, "the Platinum toasts still show");
    assert.deepEqual(confettiLayers(fake), [], "no confetti layer prepared or drawn");
    assert.deepEqual(fake.soundsPlayed(), [], "no confetti sound");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
