// ============================================================
// The Fireworks, through main.js on the fake PinballY globals: none for
// the toasts of a Play that reaches no new level; a Play that crosses a
// level shows the Level Toast and the first rocket together, on layers
// just above the Confetti Shower's; the show plays once, about 8 s, and
// leaves nothing shown nor any frame timer running.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, levelToasts, allToasts, play, errorLines, TABLES, MINUTE, ALL_TOASTS_MS, pickLastTables } from "../mastery/mastery_bar_scenario.js";
import { fireworksLayers, visibleFireworksCount, fireworksStartLogs } from "./fireworks_reader.js";
import { CONFETTI_Z_INDEX } from "../../common/confetti_shower.js";
import { ACHIEVEMENT_TOAST_Z_INDEX } from "../../common/achievement_toast.js";

const [FIRST, SECOND] = TABLES;
// About 8 s, plus a margin.
const SHOW_MAX_MS = 10000;
const STEP_MS = 10;

test("a Level Toast and its first rocket show together, then the Fireworks play once, about 8 s", async () => {
    pickLastTables();
    const fake = await startScenario({ addOns: ["achievements"], profiles: { guest: {} } });
    fake.advanceTime(ALL_TOASTS_MS);
    assert.ok(fireworksLayers(fake).length > 0, "drawn ahead");
    assert.ok(fireworksLayers(fake).every(layer => layer.zIndex > CONFETTI_Z_INDEX && CONFETTI_Z_INDEX > ACHIEVEMENT_TOAST_Z_INDEX),
        "in front of the Confetti Shower, itself in front of the toasts");

    // First table: four Achievement Toasts, then the level 2 Level Toast.
    await play(fake, FIRST, 10 * MINUTE);
    let toastAtMs = null;
    let firstVisibleAtMs = null;
    let lastVisibleAtMs = null;
    for (let elapsedMs = 0; elapsedMs <= ALL_TOASTS_MS; elapsedMs += STEP_MS) {
        if (toastAtMs === null && levelToasts(fake).length === 1) toastAtMs = elapsedMs;
        if (visibleFireworksCount(fake) > 0) {
            if (firstVisibleAtMs === null) firstVisibleAtMs = elapsedMs;
            lastVisibleAtMs = elapsedMs;
        }
        fake.advanceTime(STEP_MS);
    }
    assert.equal(allToasts(fake).length, 5);
    assert.notEqual(toastAtMs, null, "the Level Toast showed");
    assert.equal(firstVisibleAtMs, toastAtMs, "the first rocket shows with the Level Toast, not with the Achievement Toasts");
    assert.ok(lastVisibleAtMs - firstVisibleAtMs > 6000 && lastVisibleAtMs - firstVisibleAtMs < SHOW_MAX_MS,
        `the show lasts about 8 s, not ${lastVisibleAtMs - firstVisibleAtMs} ms`);
    assert.equal(visibleFireworksCount(fake), 0, "nothing left shown");
    assert.equal(fake.runningIntervalCount(), 0, "no frame timer left running");
    assert.equal(fireworksStartLogs(fake).length, 1);

    // Past 10:10, which would bring Mirror Hour.
    fake.advanceTime(5 * MINUTE * 1000);
    // Another table: new Achievement Toasts, still level 2.
    await play(fake, SECOND, 5 * MINUTE);
    let mostVisible = 0;
    for (let elapsedMs = 0; elapsedMs <= ALL_TOASTS_MS; elapsedMs += 100) {
        mostVisible = Math.max(mostVisible, visibleFireworksCount(fake));
        fake.advanceTime(100);
    }
    assert.ok(allToasts(fake).length > 5, "new Achievement Toasts");
    assert.equal(mostVisible, 0, "no Fireworks without a Level Toast");
    assert.equal(fireworksStartLogs(fake).length, 1);
    assert.deepEqual(errorLines(fake), []);
});
