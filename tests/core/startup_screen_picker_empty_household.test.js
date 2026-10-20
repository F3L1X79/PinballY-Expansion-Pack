// ============================================================
// Startup Screen "profilePicker" while the Household is empty (Guest
// only): no carousel, the Welcome Screen opens directly, and nothing is
// logged as a fallback.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { isWelcomeScreenOpen, startupVeil, WELCOME_SCREEN_PAUSE_MS, WELCOME_SCREEN_OPEN_MS } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen } from "./startup_picker_scenario.js";

test("with Guest alone, the startup Profile picker is skipped for the Welcome Screen", async () => {
    const { fake, lang, settle } = await startOnProfilePicker({ profiles: [], activeProfile: "guest" });
    assert.equal(startupVeil(fake).shown, true);
    await settle();
    fake.advanceTime(WELCOME_SCREEN_PAUSE_MS);
    assert.equal(isCarouselOpen(fake, lang), false, "no carousel");
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true, "the Welcome Screen directly");
    assert.equal(isCarouselOpen(fake, lang), false);
    assert.deepEqual(fake.logLines().filter(line => line.includes("Startup Screen") || line.includes("startupScreen")), [], "no fallback logged");
    assertNoErrorLogged(fake);
});
