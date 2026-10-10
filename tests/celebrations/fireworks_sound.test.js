// ============================================================
// FIREWORKS_SOUND_FILE with CONFETTI=false, through main.js on the fake
// PinballY globals: no confetti is drawn ahead, but a Play crossing a
// level starts the Fireworks, and their sound plays once, as they start.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, levelToasts, play, errorLines, TABLES, MINUTE, ALL_TOASTS_MS, levelToastOf, pickLastTables } from "../mastery/mastery_bar_scenario.js";
import { fireworksStartLogs } from "./fireworks_reader.js";
import { confettiLayers } from "./confetti_shower_scenario.js";

const FIREWORKS_SOUND_FILE = "C:\\Sounds\\fireworks.wav";
const STEP_MS = 10;
// The show and its toasts, with a margin.
const SHOW_MS = 2 * ALL_TOASTS_MS;

test("CONFETTI=false: the Fireworks still play, their sound once, as they start", async () => {
    pickLastTables();
    const fake = await startScenario({
        addOns: ["achievements"], profiles: { guest: {} },
        settings: { confetti: false, fireworksSoundFile: FIREWORKS_SOUND_FILE }, soundFiles: [FIREWORKS_SOUND_FILE],
    });
    fake.advanceTime(ALL_TOASTS_MS);
    assert.deepEqual(fake.soundsPlayed(), [], "nothing before the show");

    await play(fake, TABLES[0], 10 * MINUTE);
    let soundsAtStart = null;
    for (let elapsedMs = 0; elapsedMs <= SHOW_MS; elapsedMs += STEP_MS) {
        if (soundsAtStart === null && fireworksStartLogs(fake).length === 1) soundsAtStart = fake.soundsPlayed().length;
        fake.advanceTime(STEP_MS);
    }

    assert.deepEqual(levelToasts(fake), [levelToastOf(2)]);
    assert.equal(fireworksStartLogs(fake).length, 1, "the Fireworks play");
    assert.equal(soundsAtStart, 1, "the sound plays as the show starts");
    assert.deepEqual(fake.soundsPlayed(), [FIREWORKS_SOUND_FILE], "once");
    assert.deepEqual(confettiLayers(fake), [], "no confetti drawn ahead");
    assert.deepEqual(errorLines(fake), []);
});
