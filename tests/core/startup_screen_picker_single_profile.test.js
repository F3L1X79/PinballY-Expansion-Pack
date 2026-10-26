// ============================================================
// The default Startup Screen, the Profile picker, while the Household has a
// single Profile: no carousel, the Welcome Screen after its startup pause,
// the last active Profile still active, and nothing logged as a fallback.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    isWelcomeScreenOpen, startupVeil, greeting, welcomeScreenLayerCount, WELCOME_SCREEN_PAUSE_MS, WELCOME_SCREEN_OPEN_MS,
} from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen } from "./startup_picker_scenario.js";

test("with a single household Profile, the startup Profile picker is skipped for the Welcome Screen", async () => {
    const { fake, lang, store, settle } = await startOnProfilePicker({ profiles: ["Alice"], activeProfile: "Alice" });
    assert.equal(startupVeil(fake).shown, true);
    await settle();
    fake.advanceTime(WELCOME_SCREEN_PAUSE_MS - 1);
    assert.equal(welcomeScreenLayerCount(fake), 0, "the Welcome Screen waits its startup pause");
    assert.equal(isCarouselOpen(fake, lang), false, "no carousel");
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true, "the Welcome Screen");
    assert.equal(isCarouselOpen(fake, lang), false);
    assert.equal(store.getActiveProfile().name, "Alice");
    assert.ok(greeting(fake).includes("Alice"), "greeting the last active Profile");
    assert.deepEqual(fake.logLines().filter(line => line.includes("Startup Screen") || line.includes("startupScreen")), [], "no fallback logged");
    assertNoErrorLogged(fake);
});
