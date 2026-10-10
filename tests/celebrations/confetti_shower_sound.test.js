// ============================================================
// CONFETTI_SOUND_FILE, through main.js on the fake PinballY globals: one
// return to the wheel completes the week's Challenge and unlocks three
// Platinum Achievements. A single shower falls, its sound plays once, and
// each toast still plays the Achievement sound.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { toastDrawings } from "../achievements/achievement_toast_reader.js";
import { startScenario, playLastTable, showerStartLogs, ALL_TOASTS_MS, challengeTitle } from "./confetti_shower_scenario.js";

const CONFETTI_SOUND_FILE = "C:\\Sounds\\cheers.wav";
const ACHIEVEMENT_SOUND_FILE = "C:\\Sounds\\trophy.wav";

test("a Challenge and Platinums on one return to the wheel: one shower, its sound once", async () => {
    const fake = await startScenario({
        challenge: true,
        confettiSoundFile: CONFETTI_SOUND_FILE,
        achievementSoundFile: ACHIEVEMENT_SOUND_FILE,
        soundFiles: [CONFETTI_SOUND_FILE, ACHIEVEMENT_SOUND_FILE],
    });
    const title = await challengeTitle();
    fake.advanceTime(ALL_TOASTS_MS);
    const toastsBefore = toastDrawings(fake).length;
    const soundsBefore = fake.soundsPlayed().length;

    await playLastTable(fake);
    fake.advanceTime(ALL_TOASTS_MS);

    const newToasts = toastDrawings(fake).slice(toastsBefore);
    assert.ok(newToasts.some(drawing => drawing.texts.includes(title)), "the Challenge Toast shows");
    assert.ok(newToasts.length >= 4, "with the three Platinum toasts");
    assert.equal(showerStartLogs(fake).length, 1, "a single shower");
    const sounds = fake.soundsPlayed().slice(soundsBefore);
    assert.equal(sounds.filter(file => file === CONFETTI_SOUND_FILE).length, 1, "the shower's sound once");
    assert.equal(sounds.filter(file => file === ACHIEVEMENT_SOUND_FILE).length, newToasts.length,
        "the Achievement sound with each toast");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
