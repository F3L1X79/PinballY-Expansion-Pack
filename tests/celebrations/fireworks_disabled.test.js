// ============================================================
// FIREWORKS=false: the Fireworks prepare nothing (no layer, no drawing
// ahead), and through main.js on the fake PinballY globals a Play crossing
// a level still shows its Level Toast, with no Fireworks and no
// FIREWORKS_SOUND_FILE, while the Confetti Shower is still drawn ahead.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import { startScenario, levelToasts, play, errorLines, TABLES, MINUTE, ALL_TOASTS_MS, levelToastOf, pickLastTables } from "../mastery/mastery_bar_scenario.js";
import { fireworksLayers } from "./fireworks_reader.js";
import { confettiLayers } from "./confetti_shower_scenario.js";
import { createFireworks } from "../../common/fireworks.js";

const FIREWORKS_SOUND_FILE = "C:\\Sounds\\fireworks.wav";

test("disabled Fireworks queue no drawing ahead, create no layer and start nothing", () => {
    const fake = createFakePinballYHost();
    const steps = [];
    const fireworks = createFireworks(fake, { enabled: false, soundFile: FIREWORKS_SOUND_FILE, drawingAhead: { add: step => steps.push(step) } });
    fireworks.start();

    assert.deepEqual(steps, []);
    assert.deepEqual(fireworksLayers(fake), []);
    assert.deepEqual(fake.soundsPlayed(), []);
});

test("FIREWORKS=false: the Level Toast shows, with no Fireworks and no Fireworks sound, and the confetti still drawn ahead", async () => {
    pickLastTables();
    const fake = await startScenario({
        addOns: ["achievements"], profiles: { guest: {} },
        settings: { fireworks: false, fireworksSoundFile: FIREWORKS_SOUND_FILE }, soundFiles: [FIREWORKS_SOUND_FILE],
    });
    fake.advanceTime(ALL_TOASTS_MS);

    await play(fake, TABLES[0], 10 * MINUTE);
    fake.advanceTime(ALL_TOASTS_MS);

    assert.deepEqual(levelToasts(fake), [levelToastOf(2)], "the Level Toast still shows");
    assert.deepEqual(fireworksLayers(fake), [], "no Fireworks layer");
    assert.deepEqual(fake.soundsPlayed(), [], "no Fireworks sound");
    assert.deepEqual(fake.logLines().filter(line => line.startsWith("[Fireworks]")), []);
    assert.ok(confettiLayers(fake).length > 0, "the Confetti Shower is still drawn ahead");
    assert.deepEqual(errorLines(fake), []);
});
