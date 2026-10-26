// ============================================================
// An unknown startupScreen value: PinballY starts on the default Startup
// Screen, the Profile picker, with its veil and Loader, and the log names
// the accepted values.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readLoader } from "../support/loader_reader.js";
import { isWelcomeScreenOpen, startupVeil } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen, CAROUSEL_PAUSE_MS } from "./startup_picker_scenario.js";

test("a mistyped Startup Screen falls back to the Profile picker, naming the accepted values", async () => {
    const { fake, lang, settle } = await startOnProfilePicker({ settings: { startupScreen: "profilepicker" } });
    assert.equal(startupVeil(fake).shown, true, "the startup veil");
    assert.equal(readLoader(fake).shown, true, "the Loader");
    await settle();
    fake.advanceTime(CAROUSEL_PAUSE_MS);
    assert.equal(isCarouselOpen(fake, lang), true, "the carousel");
    assert.equal(isWelcomeScreenOpen(fake), false);
    assert.deepEqual(fake.logLines().filter(line => line.includes("startupScreen")),
        ["[Config] startupScreen \"profilepicker\" is not one of welcome, profilePicker, wheel; starting on the Profile picker."]);
    assertNoErrorLogged(fake);
});
