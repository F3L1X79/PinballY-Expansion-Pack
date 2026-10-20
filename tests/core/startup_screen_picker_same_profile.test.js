// ============================================================
// Startup Screen "profilePicker": Start on the last active Profile still
// brings the Welcome Screen for it; Change Player from that screen then
// behaves as it always does.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readLoader } from "../support/loader_reader.js";
import { press, isWelcomeScreenOpen, startupVeil, greeting, choose, WELCOME_SCREEN_PAUSE_MS, WELCOME_SCREEN_OPEN_MS } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen, highlightedName, CAROUSEL_PAUSE_MS, GLIDE_OVER_MS } from "./startup_picker_scenario.js";

test("keeping the last active Profile in the startup Profile picker brings its Welcome Screen", async () => {
    const { fake, lang, store, settle } = await startOnProfilePicker();
    const names = [lang.profiles.guestName, "Alice", "Bob"];
    await settle();
    fake.advanceTime(CAROUSEL_PAUSE_MS);
    assert.equal(highlightedName(fake, names), "Bob");

    press(fake, "Select");
    await settle();
    assert.equal(store.getActiveProfile().name, "Bob");
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true, "the Welcome Screen follows all the same");
    assert.ok(greeting(fake).includes("Bob"));

    // Change Player from the screen: the carousel opens at once, with no veil.
    choose(fake, lang.profiles.menuEntry);
    await settle();
    assert.equal(isCarouselOpen(fake, lang), true);
    assert.deepEqual(startupVeil(fake), { shown: false });
    press(fake, "Prev");
    fake.advanceTime(GLIDE_OVER_MS);
    press(fake, "Select");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_PAUSE_MS / 2);
    assert.deepEqual(startupVeil(fake), { shown: false }, "no veil after Change Player");
    assert.deepEqual(readLoader(fake), { shown: false });
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    await settle();
    assert.equal(isWelcomeScreenOpen(fake), true, "the new player's Welcome Screen");
    assert.ok(greeting(fake).includes("Alice"));
    assertNoErrorLogged(fake);
});
