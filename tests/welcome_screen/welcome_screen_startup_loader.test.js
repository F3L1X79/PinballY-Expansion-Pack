// ============================================================
// The startup veil and Loader: from the first frame the wheel is dimmed and
// the comet turns just under the panel; the comet goes when the panel fades
// in, the veil once it is in. None after Change Player.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readLoader, loaderLayerCount } from "../support/loader_reader.js";
import { WELCOME_SCREEN_OPEN_MS, press, isWelcomeScreenOpen, choose, startupVeil, welcomeScreenLayerCount } from "./welcome_screen_reader.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
// The panel's backdrop dims the wheel with this colour, from 6100 up.
const DIMMED = 0xD0080A0E;
const VEIL = { shown: true, zIndex: 6098, color: DIMMED };
const LOADER = { shown: true, zIndex: 6099, scale: { ySpan: 0.07 }, position: { x: 0, y: 0 } };
// Within the panel's fade-in, which lasts about 220 ms.
const FADING_MS = 100;
const GLIDE_OVER_MS = 500;
const SETTLED_MS = 2500;

test("the wheel is veiled with the comet turning until the Welcome Screen fades in, and not after Change Player", async () => {
    const fake = createFakePinballYHost();
    for (const name of ["Alice", "Bob"]) fake.addFolder(`${PROFILES_FOLDER}\\${name}`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Bob" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "startupChoicePrompt" || key === "profilePicker";
    config.language = "en";
    config.startupScreen = "welcome";

    const { default: lang } = await import("../../common/core/i18n.js");
    await import("../../main.js");
    assert.deepEqual(startupVeil(fake), VEIL, "the wheel dimmed from the first frame");
    assert.deepEqual(readLoader(fake), LOADER, "the comet turning just under the panel");
    assert.equal(press(fake, "Next").defaultPrevented, false, "a button goes through to the wheel");
    assert.equal(fake.fire("keydown", { key: "Enter", code: "Enter", repeat: false }).defaultPrevented, false, "a key goes through");
    assert.equal(welcomeScreenLayerCount(fake), 0, "nothing of the panel drawn before its turn");

    await settle();
    assert.deepEqual(readLoader(fake), { shown: false }, "the comet goes as the panel starts fading in");
    assert.equal(loaderLayerCount(fake), 0);
    fake.advanceTime(FADING_MS);
    assert.equal(isWelcomeScreenOpen(fake), true, "the panel fading in");
    assert.deepEqual(startupVeil(fake), VEIL, "the veil stays while the panel fades in");
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS - FADING_MS);
    assert.deepEqual(startupVeil(fake), { shown: false }, "the veil goes once the panel is fully in");

    // Change Player from the screen: the screen comes back for Alice.
    choose(fake, lang.profiles.menuEntry);
    await settle();
    press(fake, "Prev");
    fake.advanceTime(GLIDE_OVER_MS);
    press(fake, "Select");
    await settle();
    fake.advanceTime(FADING_MS);
    assert.deepEqual(startupVeil(fake), { shown: false }, "no veil before the new player's screen");
    assert.deepEqual(readLoader(fake), { shown: false }, "no comet before the new player's screen");
    fake.advanceTime(SETTLED_MS);
    await settle();
    assert.equal(isWelcomeScreenOpen(fake), true, "the screen greets the new player");
    assert.deepEqual(startupVeil(fake), { shown: false });
    assert.equal(loaderLayerCount(fake), 0);
    assertNoErrorLogged(fake);
});
