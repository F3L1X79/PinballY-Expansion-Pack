// ============================================================
// Startup Screen "profilePicker", the carousel opened from the main menu
// before the startup carousel's turn: it becomes the startup carousel, so
// its turn never opens it again, and Exit still brings the Welcome Screen.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { press, isWelcomeScreenOpen, greeting, WELCOME_SCREEN_OPEN_MS } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen, highlightedName, GLIDE_OVER_MS } from "./startup_picker_scenario.js";

const SETTLED_MS = 3000;

test("a carousel opened from the main menu during startup is the startup one", async () => {
    const { fake, lang, store, settle } = await startOnProfilePicker();
    const names = [lang.profiles.guestName, "Alice", "Bob"];
    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    fake.selectMenuItem(lang.profiles.menuEntry);
    assert.equal(isCarouselOpen(fake, lang), true);
    press(fake, "Prev");
    await settle();
    fake.advanceTime(GLIDE_OVER_MS);
    await settle();
    assert.equal(highlightedName(fake, names), "Alice", "its turn does not open it again");

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
