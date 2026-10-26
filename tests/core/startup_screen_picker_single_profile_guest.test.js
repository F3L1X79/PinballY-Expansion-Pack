// ============================================================
// The default Startup Screen, the Profile picker, while the Household has a
// single Profile and Guest was the last active one: no carousel, and the
// Welcome Screen greets Guest, never switched to the only household Profile.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { isWelcomeScreenOpen, greeting, WELCOME_SCREEN_OPEN_MS } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen } from "./startup_picker_scenario.js";

test("with a single household Profile and Guest last active, Guest stays active and is greeted", async () => {
    const { fake, lang, store, settle } = await startOnProfilePicker({ profiles: ["Alice"], activeProfile: "guest" });
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isCarouselOpen(fake, lang), false, "no carousel");
    assert.equal(isWelcomeScreenOpen(fake), true, "the Welcome Screen");
    assert.equal(store.getActiveProfile().isGuest, true, "Guest still active");
    assert.ok(greeting(fake).includes(lang.profiles.guestName), "Guest greeted");
    assert.equal(greeting(fake).includes("Alice"), false);
    assertNoErrorLogged(fake);
});
