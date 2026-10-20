// ============================================================
// Startup Screen "profilePicker", the carousel opened from the main menu
// during the startup pause: it becomes the startup carousel, so the pause
// never opens it again, and Exit still brings the Welcome Screen.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { press, isWelcomeScreenOpen, greeting, WELCOME_SCREEN_OPEN_MS } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen, highlightedName, CAROUSEL_PAUSE_MS, GLIDE_OVER_MS } from "./startup_picker_scenario.js";

const SETTLED_MS = 3000;

test("a carousel opened from the main menu during startup is the startup one", async () => {
    const { fake, lang, store, settle } = await startOnProfilePicker();
    const names = [lang.profiles.guestName, "Alice", "Bob"];
    await settle();
    fake.advanceTime(CAROUSEL_PAUSE_MS / 2);
    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    fake.selectMenuItem(lang.profiles.menuEntry);
    await settle();
    assert.equal(isCarouselOpen(fake, lang), true);
    press(fake, "Prev");
    fake.advanceTime(GLIDE_OVER_MS + CAROUSEL_PAUSE_MS);
    await settle();
    assert.equal(highlightedName(fake, names), "Alice", "the startup pause does not open it again");

    press(fake, "Exit");
    await settle();
    assert.equal(store.getActiveProfile().name, "Bob");
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true, "the Welcome Screen follows");
    assert.ok(greeting(fake).includes("Bob"));
    fake.advanceTime(SETTLED_MS);
    await settle();
    assert.equal(isCarouselOpen(fake, lang), false, "no carousel over the Welcome Screen");
    assertNoErrorLogged(fake);
});
