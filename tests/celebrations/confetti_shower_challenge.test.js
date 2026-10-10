// ============================================================
// The Confetti Shower with a completed Challenge, through main.js on the
// fake PinballY globals: Guest completes the week's Challenge with no
// Platinum, the confetti start with its Challenge Toast, and a missing
// CONFETTI_SOUND_FILE is logged while the confetti still fall.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { toastDrawings } from "../achievements/achievement_toast_reader.js";
import {
    startScenario, playTable, advanceUntil, visibleConfettiCount, showerStartLogs,
    PLAYED_TABLE, ALL_TOASTS_MS, challengeTitle,
} from "./confetti_shower_scenario.js";

const MISSING_SOUND_FILE = "C:\\Sounds\\missing.wav";
// The release tween lets the first confetti out about 0.1 s after the start.
const SAME_MOMENT_MS = 200;

test("Guest's completed Challenge brings the confetti with its Challenge Toast, even with a missing sound", async () => {
    const fake = await startScenario({ challenge: true, confettiSoundFile: MISSING_SOUND_FILE });
    const title = await challengeTitle();
    fake.advanceTime(ALL_TOASTS_MS);
    assert.equal(showerStartLogs(fake).length, 0, "no shower before the Challenge");

    await playTable(fake, PLAYED_TABLE);

    const challengeToastShows = () => toastDrawings(fake).some(drawing => drawing.texts.includes(title));
    let toastMs = null;
    const confettiMs = advanceUntil(fake, { stepMs: 10, maxMs: ALL_TOASTS_MS }, elapsedMs => {
        if (toastMs === null && challengeToastShows()) toastMs = elapsedMs;
        return visibleConfettiCount(fake) > 0;
    });
    assert.notEqual(toastMs, null, "the Challenge Toast shows");
    assert.notEqual(confettiMs, null, "the confetti fall despite the missing sound");
    assert.ok(confettiMs >= toastMs && confettiMs - toastMs <= SAME_MOMENT_MS, `the confetti start with the Challenge Toast (${toastMs} ms, ${confettiMs} ms)`);
    assert.equal(showerStartLogs(fake).length, 1);

    const errors = fake.logLines().filter(line => line.includes("ERROR"));
    assert.equal(errors.length, 1, "the missing sound is logged once");
    assert.match(errors[0], /\[ConfettiShower\].*missing\.wav/);
});
