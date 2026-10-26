// ============================================================
// The default Startup Screen, the Profile picker, with one adult and one
// Child Profile: a Child Profile counts in the Household, so the carousel
// opens at startup.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { isWelcomeScreenOpen } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen, CAROUSEL_PAUSE_MS } from "./startup_picker_scenario.js";

test("a Child Profile counts: with one adult and one child, the startup Profile picker opens", async () => {
    const { fake, lang, store, settle } = await startOnProfilePicker({ profiles: ["Alice", "Kid"], childProfiles: ["Kid"], activeProfile: "Alice" });
    assert.equal(store.isChild("Kid"), true, "Kid is a Child Profile");
    await settle();
    fake.advanceTime(CAROUSEL_PAUSE_MS);
    assert.equal(isCarouselOpen(fake, lang), true, "the carousel shows");
    assert.equal(isWelcomeScreenOpen(fake), false);
    assertNoErrorLogged(fake);
});
