// ============================================================
// A FIREWORKS_SOUND_FILE that cannot play, through main.js on the fake
// PinballY globals: the failure is logged under [Fireworks] and the show
// goes on.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, levelToasts, play, errorLines, TABLES, MINUTE, ALL_TOASTS_MS, levelToastOf, pickLastTables } from "./mastery_bar_scenario.js";
import { fireworksStartLogs, visibleFireworksCount } from "./fireworks_reader.js";

const STEP_MS = 10;

test("a missing Fireworks sound is logged and the show goes on", async () => {
    pickLastTables();
    // The file is never added: it is missing.
    const fake = await startScenario({
        addOns: ["achievements"], profiles: { guest: {} }, settings: { fireworksSoundFile: "C:\\Sounds\\missing.wav" },
    });
    fake.advanceTime(ALL_TOASTS_MS);

    await play(fake, TABLES[0], 10 * MINUTE);
    let mostVisible = 0;
    for (let elapsedMs = 0; elapsedMs <= ALL_TOASTS_MS; elapsedMs += STEP_MS) {
        mostVisible = Math.max(mostVisible, visibleFireworksCount(fake));
        fake.advanceTime(STEP_MS);
    }

    assert.deepEqual(levelToasts(fake), [levelToastOf(2)]);
    assert.equal(fireworksStartLogs(fake).length, 1);
    assert.ok(mostVisible > 0, "the show goes on");
    const errors = errorLines(fake);
    assert.equal(errors.length, 1);
    assert.ok(errors[0].startsWith("[Fireworks] ERROR") && errors[0].includes("missing.wav"), errors[0]);
});
