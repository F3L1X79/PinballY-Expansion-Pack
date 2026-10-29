// ============================================================
// Startup Screen "profilePicker": a menu up when the Welcome Screen's turn
// comes after the pick; the screen is not drawn over it, and is drawn at
// once, for the Profile picked, when the wheel is back.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    isWelcomeScreenOpen, greeting, welcomeScreenLayerCount, press, WELCOME_SCREEN_FADE_IN_MS, WELCOME_SCREEN_OPEN_MS,
} from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, CAROUSEL_OPEN_MS, GLIDE_OVER_MS } from "./startup_picker_scenario.js";

test("a menu up at the Welcome Screen's turn after the startup Profile picker: drawn once the wheel is back", async () => {
    const { fake, store, settle } = await startOnProfilePicker();
    await settle();
    fake.advanceTime(CAROUSEL_OPEN_MS);
    press(fake, "Prev");
    fake.advanceTime(GLIDE_OVER_MS);
    press(fake, "Select");
    fake.openMainMenu();
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(store.getActiveProfile().name, "Alice");
    assert.equal(welcomeScreenLayerCount(fake), 0, "not drawn over the menu");

    fake.closeMenu();
    await settle();
    assert.ok(welcomeScreenLayerCount(fake) > 0, "drawn as the wheel is back");
    fake.advanceTime(WELCOME_SCREEN_FADE_IN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true);
    assert.ok(greeting(fake).includes("Alice"), "for the Profile picked");
    assertNoErrorLogged(fake);
});
