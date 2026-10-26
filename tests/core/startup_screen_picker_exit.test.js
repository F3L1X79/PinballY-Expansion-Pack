// ============================================================
// Startup Screen "profilePicker": Exit keeps the last active Profile, even
// after browsing, and its Welcome Screen follows, Close highlighted.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { press, isWelcomeScreenOpen, startupVeil, greeting, highlighted, welcomeScreenLayerCount, WELCOME_SCREEN_FADE_IN_MS } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen, CAROUSEL_PAUSE_MS, GLIDE_OVER_MS } from "./startup_picker_scenario.js";

test("Exit in the startup Profile picker keeps the last active Profile and its Welcome Screen follows", async () => {
    const { fake, lang, store, settle } = await startOnProfilePicker();
    await settle();
    fake.advanceTime(CAROUSEL_PAUSE_MS);
    press(fake, "Prev");
    fake.advanceTime(GLIDE_OVER_MS);

    assert.equal(press(fake, "Exit").defaultPrevented, true);
    await settle();
    assert.equal(isCarouselOpen(fake, lang), false);
    assert.equal(store.getActiveProfile().name, "Bob", "the last active Profile stays");
    assert.equal(startupVeil(fake).shown, true, "the wheel stays dimmed");
    assert.ok(welcomeScreenLayerCount(fake) > 0, "drawn at its turn, without the startup pause");
    fake.advanceTime(WELCOME_SCREEN_FADE_IN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true, "the Welcome Screen follows");
    assert.ok(greeting(fake).includes("Bob"));
    assert.equal(highlighted(fake).tooltip, lang.buttonHints.close, "Close, as after a pick");
    assertNoErrorLogged(fake);
});
