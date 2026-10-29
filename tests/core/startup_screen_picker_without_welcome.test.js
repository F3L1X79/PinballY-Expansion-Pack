// ============================================================
// Startup Screen "profilePicker" with the Welcome Screen Add-on off: the
// carousel at startup, then the Profile Greeting of the Profile picked,
// once; no fallback is logged.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readLoader } from "../support/loader_reader.js";
import { press, startupVeil } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, pickerTexts, isCarouselOpen, CAROUSEL_OPEN_MS, GLIDE_OVER_MS } from "./startup_picker_scenario.js";

const PAUSE_OVER_MS = 600;
const GREETING_OVER_MS = 2500;

test("without the Welcome Screen, the startup Profile picker is followed by the greeting of the Profile picked", async () => {
    const { fake, lang, store, settle } = await startOnProfilePicker({ addOns: ["profilePicker"] });
    const greetings = () => pickerTexts(fake).filter(text => text === lang.profiles.greeting("Alice") || text === lang.profiles.greeting("Bob"));
    assert.equal(startupVeil(fake).shown, true, "the wheel dimmed from the first frame");
    await settle();
    fake.advanceTime(CAROUSEL_OPEN_MS);
    assert.equal(isCarouselOpen(fake, lang), true, "the carousel at startup");
    assert.deepEqual(readLoader(fake), { shown: false });
    assert.deepEqual(greetings(), [], "no greeting before the pick");

    press(fake, "Prev");
    fake.advanceTime(GLIDE_OVER_MS);
    press(fake, "Select");
    await settle();
    assert.equal(store.getActiveProfile().name, "Alice");
    assert.deepEqual(startupVeil(fake), { shown: false }, "the veil goes with the carousel");
    fake.advanceTime(PAUSE_OVER_MS);
    // Its shadow and itself.
    assert.deepEqual(new Set(greetings()), new Set([lang.profiles.greeting("Alice")]), "the Profile picked is greeted");
    fake.advanceTime(GREETING_OVER_MS);
    assert.deepEqual(greetings(), [], "then the greeting fades out");
    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    fake.closeMenu();
    await settle();
    fake.advanceTime(GREETING_OVER_MS);
    assert.deepEqual(greetings(), [], "only once");
    assert.deepEqual(fake.logLines().filter(line => line.includes("Startup Screen")), [], "no fallback logged");
    assertNoErrorLogged(fake);
});
