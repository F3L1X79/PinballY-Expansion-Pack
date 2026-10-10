// ============================================================
// No level pip on the Welcome Screen with the Achievements Add-on off,
// through main.js on the fake PinballY globals: the Avatar shows alone.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines } from "../mastery/mastery_bar_scenario.js";
import { WELCOME_SCREEN_OPEN_MS, headerImages, headerPip, isWelcomeScreenOpen } from "./welcome_screen_reader.js";

test("no pip on the Welcome Screen with the Achievements Add-on off", async () => {
    const fake = await startScenario({ addOns: ["profilePicker", "startupChoicePrompt"], profiles: { guest: {} } });
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true);
    assert.equal(headerImages(fake).length, 1, "the Avatar shows");
    assert.equal(headerPip(fake), null, "without a pip");

    assert.deepEqual(errorLines(fake), []);
});
