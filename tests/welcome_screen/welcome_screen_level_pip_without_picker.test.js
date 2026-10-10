// ============================================================
// No level pip on the Welcome Screen without the Profile picker, through
// main.js on the fake PinballY globals: there is no Avatar to carry it,
// even with the Achievements Add-on on.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines } from "../mastery/mastery_bar_scenario.js";
import { WELCOME_SCREEN_OPEN_MS, headerImages, headerPip, isWelcomeScreenOpen } from "./welcome_screen_reader.js";

test("no pip on the Welcome Screen without the Profile picker", async () => {
    const fake = await startScenario({ addOns: ["achievements", "startupChoicePrompt"], profiles: { guest: {} } });
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true);
    assert.deepEqual(headerImages(fake), [], "no Avatar");
    assert.equal(headerPip(fake), null, "without a pip");

    assert.deepEqual(errorLines(fake), []);
});
