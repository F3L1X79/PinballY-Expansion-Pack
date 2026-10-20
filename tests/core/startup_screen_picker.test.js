// ============================================================
// Startup Screen "profilePicker": the veil and the Loader from the first
// frame, then the carousel on the last active Profile with its usual hint;
// picking another Profile switches and one Welcome Screen follows for it,
// the wheel dimmed all along. A toast waits for both; no Profile Greeting.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readLoader } from "../support/loader_reader.js";
import { toastDrawings } from "../achievements/achievement_toast_reader.js";
import {
    press, isWelcomeScreenOpen, startupVeil, greeting, welcomeScreenLayerCount, WELCOME_SCREEN_PAUSE_MS, WELCOME_SCREEN_OPEN_MS,
} from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, pickerTexts, isCarouselOpen, highlightedName, CAROUSEL_PAUSE_MS, GLIDE_OVER_MS } from "./startup_picker_scenario.js";

// Enough for a toast to start.
const TOAST_RISE_MS = 1000;
const SETTLED_MS = 3000;

// The waiting toast's draws: the carousel, drawn ahead, shares their z-index.
const waitingToasts = fake => toastDrawings(fake).filter(drawing => drawing.texts.includes("Waiting")).length;

test("the startup Profile picker opens on the last active Profile and the Welcome Screen follows the pick", async () => {
    const { fake, lang, store, toasts, settle } = await startOnProfilePicker();
    const names = [lang.profiles.guestName, "Alice", "Bob"];
    assert.equal(startupVeil(fake).shown, true, "the wheel dimmed from the first frame");
    assert.equal(readLoader(fake).shown, true, "the Loader turning");
    await settle();
    toasts.submit({ title: "Waiting", description: "", onShown() {} });

    fake.advanceTime(CAROUSEL_PAUSE_MS);
    assert.equal(isCarouselOpen(fake, lang), true, "the carousel shows");
    assert.ok(pickerTexts(fake).includes(lang.profiles.pickerHint), "with its usual hint");
    assert.equal(highlightedName(fake, names), "Bob", "on the last active Profile");
    assert.deepEqual(readLoader(fake), { shown: false }, "the Loader goes as the carousel shows");
    assert.equal(startupVeil(fake).shown, true, "the veil stays under it");
    fake.advanceTime(TOAST_RISE_MS);
    assert.equal(waitingToasts(fake), 0, "the toast waits for the carousel");
    assert.equal(isWelcomeScreenOpen(fake), false);

    press(fake, "Prev");
    fake.advanceTime(GLIDE_OVER_MS);
    assert.equal(press(fake, "Select").defaultPrevented, true);
    await settle();
    assert.equal(store.getActiveProfile().name, "Alice", "the pick switches");
    assert.equal(isCarouselOpen(fake, lang), false);
    assert.equal(startupVeil(fake).shown, true, "the wheel stays dimmed until the Welcome Screen");
    fake.advanceTime(WELCOME_SCREEN_PAUSE_MS / 2);
    assert.equal(startupVeil(fake).shown, true);
    assert.equal(waitingToasts(fake), 0, "the toast waits for the Welcome Screen");
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true, "the Welcome Screen follows");
    assert.ok(greeting(fake).includes("Alice"), "for the Profile picked");
    assert.deepEqual(startupVeil(fake), { shown: false }, "the veil goes once the panel is in");
    assert.equal(pickerTexts(fake).includes(lang.profiles.greeting("Alice")), false, "no Profile Greeting");
    const layerCount = welcomeScreenLayerCount(fake);
    fake.advanceTime(SETTLED_MS);
    await settle();
    assert.equal(welcomeScreenLayerCount(fake), layerCount, "a single Welcome Screen");
    assert.equal(waitingToasts(fake), 0, "the toast still waits");

    press(fake, "Exit");
    await settle();
    assert.equal(isWelcomeScreenOpen(fake), false);
    fake.advanceTime(TOAST_RISE_MS);
    assert.ok(waitingToasts(fake) > 0, "the toast shows once the Welcome Screen closed");
    fake.advanceTime(SETTLED_MS);
    await settle();
    assert.equal(isWelcomeScreenOpen(fake), false, "no second Welcome Screen");
    assert.equal(pickerTexts(fake).some(text => text === lang.profiles.greeting("Alice") || text === lang.profiles.greeting("Bob")), false,
        "no Profile Greeting at startup");
    assertNoErrorLogged(fake);
});
