// ============================================================
// Startup Screen "profilePicker", attract mode with the carousel open: it
// closes, the active Profile stays, the veil and the Loader go, and neither
// the carousel nor the Welcome Screen comes back after attract mode.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readLoader } from "../support/loader_reader.js";
import { press, isWelcomeScreenOpen, startupVeil } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen, CAROUSEL_OPEN_MS, GLIDE_OVER_MS } from "./startup_picker_scenario.js";

const SETTLED_MS = 3000;

test("attract mode closes the startup Profile picker for good", async () => {
    const { fake, lang, store, settle } = await startOnProfilePicker();
    await settle();
    fake.advanceTime(CAROUSEL_OPEN_MS);
    press(fake, "Prev");
    fake.advanceTime(GLIDE_OVER_MS);
    assert.equal(isCarouselOpen(fake, lang), true);

    fake.enterAttractMode();
    await settle();
    assert.equal(isCarouselOpen(fake, lang), false, "the carousel closes");
    assert.equal(store.getActiveProfile().name, "Bob", "the active Profile stays");
    assert.deepEqual(startupVeil(fake), { shown: false }, "no veil left");
    assert.deepEqual(readLoader(fake), { shown: false }, "no Loader left");
    fake.advanceTime(SETTLED_MS);
    assert.equal(isWelcomeScreenOpen(fake), false, "no Welcome Screen during attract mode");

    fake.exitAttractMode();
    await settle();
    fake.advanceTime(SETTLED_MS);
    await settle();
    assert.equal(isCarouselOpen(fake, lang), false, "no carousel after attract mode");
    assert.equal(isWelcomeScreenOpen(fake), false, "no Welcome Screen after attract mode");
    assert.equal(press(fake, "Next").defaultPrevented, false, "the buttons go to the wheel");
    assertNoErrorLogged(fake);
});
