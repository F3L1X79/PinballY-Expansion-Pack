// ============================================================
// Startup Screen "wheel" with the Profile picker Add-on off: nothing shows
// at startup, neither the Welcome Screen nor a greeting, and nothing is
// logged as an error.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { readLoader } from "../support/loader_reader.js";
import { isWelcomeScreenOpen, startupVeil, WELCOME_SCREEN_OPEN_MS } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const PICKER_Z = 6500;
const GREETING_OVER_MS = 2500;

test("starting on the wheel without the Profile picker shows nothing", async () => {
    const fake = createFakePinballYHost();
    fake.addFolder(`${PROFILES_FOLDER}\\Alice`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "startupChoicePrompt";
    config.language = "en";
    config.startupScreen = "wheel";

    await import("../../main.js");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS + GREETING_OVER_MS);
    assert.equal(isWelcomeScreenOpen(fake), false, "no Welcome Screen");
    assert.deepEqual(startupVeil(fake), { shown: false }, "no veil");
    assert.deepEqual(readLoader(fake), { shown: false }, "no Loader");
    assert.deepEqual(fake.drawingLayers().filter(layer => layer.zIndex === PICKER_Z && layer.alpha > 0), [], "no greeting");
    assert.deepEqual(fake.logLines().filter(line => line.includes("Startup Screen")), [], "no fallback: the wheel was chosen");
    assertNoErrorLogged(fake);
});
