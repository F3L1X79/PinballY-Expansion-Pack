// ============================================================
// Startup Screen "profilePicker" with the Welcome Screen Add-on off: Exit
// in the startup carousel keeps the last active Profile, which is greeted.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { press, startupVeil } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, pickerTexts, isCarouselOpen, CAROUSEL_OPEN_MS, GLIDE_OVER_MS } from "./startup_picker_scenario.js";

const PAUSE_OVER_MS = 600;

test("without the Welcome Screen, Exit in the startup Profile picker greets the last active Profile", async () => {
    const { fake, lang, store, settle } = await startOnProfilePicker({ addOns: ["profilePicker"] });
    await settle();
    fake.advanceTime(CAROUSEL_OPEN_MS);
    press(fake, "Prev");
    fake.advanceTime(GLIDE_OVER_MS);

    press(fake, "Exit");
    await settle();
    assert.equal(isCarouselOpen(fake, lang), false);
    assert.equal(store.getActiveProfile().name, "Bob", "the last active Profile stays");
    assert.deepEqual(startupVeil(fake), { shown: false });
    fake.advanceTime(PAUSE_OVER_MS);
    assert.ok(pickerTexts(fake).includes(lang.profiles.greeting("Bob")), "the Profile kept is greeted");
    assertNoErrorLogged(fake);
});
