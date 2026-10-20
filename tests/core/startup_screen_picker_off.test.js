// ============================================================
// Startup Screen "profilePicker" with the Profile picker Add-on off: the
// Welcome Screen at startup, and the log says the Startup Screen fell back.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { isWelcomeScreenOpen, startupVeil, WELCOME_SCREEN_OPEN_MS } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen } from "./startup_picker_scenario.js";

test("a Profile picker turned off gives way to the Welcome Screen, as the log says", async () => {
    const { fake, lang, settle } = await startOnProfilePicker({ addOns: ["startupChoicePrompt"] });
    assert.equal(startupVeil(fake).shown, true);
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isCarouselOpen(fake, lang), false, "no carousel");
    assert.equal(isWelcomeScreenOpen(fake), true, "the Welcome Screen");
    assert.deepEqual(fake.logLines().filter(line => line.includes("Startup Screen")),
        ["[Startup] The Profile picker Add-on is off; the Startup Screen falls back to \"welcome\"."]);
    assertNoErrorLogged(fake);
});
