// ============================================================
// Welcome Screen's Selection Marker, through main.js on the fake PinballY
// globals with the Profile picker on: the marker surrounds the Avatar on
// opening, jumps to the cross on Next, flows on as time goes by (drawn
// differently a fraction of a lap later, the same again a 6 s lap later)
// and is gone, with its timer, once attract mode closes the screen.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import {
    WELCOME_SCREEN_PAUSE_MS, WELCOME_SCREEN_OPEN_MS, press, isWelcomeScreenOpen, highlighted, markerLayer, markedImage, welcomeScreenLayerCount,
} from "./welcome_screen_reader.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const LAP_MS = 6000;

const markerStrokes = fake => markerLayer(fake).strokes();

test("the Selection Marker surrounds the Avatar, jumps on Next, flows round in 6 s and is gone once the screen closes", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 5, 0, 0) });
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({ version: 1, notified: [] }));
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["startupChoicePrompt", "profilePicker"].includes(key);
    config.language = "en";

    const { default: lang } = await import("../../common/core/i18n.js");
    const { getProfileStore } = await import("../../common/profiles/profile_store.js");
    await import("../../main.js");
    await settle();

    fake.advanceTime(WELCOME_SCREEN_PAUSE_MS - 100);
    const intervalsBefore = fake.runningIntervalCount();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS - WELCOME_SCREEN_PAUSE_MS + 100);
    assert.equal(isWelcomeScreenOpen(fake), true);
    assert.equal(markedImage(fake), getProfileStore().getActiveProfile().avatarPath, "the marker surrounds the Avatar on opening");
    assert.deepEqual(highlighted(fake), { label: null, tooltip: lang.profiles.menuEntry }, "with the Avatar's tooltip");

    press(fake, "Next");
    assert.equal(markedImage(fake), null, "the marker left the Avatar");
    assert.deepEqual(highlighted(fake), { label: null, tooltip: lang.welcomeScreen.closeTooltip }, "for the cross");

    // A move draws the marker at once, at the current point of the lap.
    press(fake, "Prev");
    const lapStart = markerStrokes(fake);
    fake.advanceTime(LAP_MS / 4);
    assert.notDeepEqual(markerStrokes(fake), lapStart, "drawn again a quarter of a lap later");
    fake.advanceTime(LAP_MS * 3 / 4);
    press(fake, "Next");
    press(fake, "Prev");
    assert.deepEqual(markerStrokes(fake), lapStart, "the same again a whole lap later");

    fake.fire("attractmodestart");
    assert.equal(isWelcomeScreenOpen(fake), false);
    assert.equal(welcomeScreenLayerCount(fake), 0, "the marker's layer is removed with the others");
    assert.equal(fake.runningIntervalCount(), intervalsBefore, "no timer of the marker keeps running");
    assertNoErrorLogged(fake);
});
