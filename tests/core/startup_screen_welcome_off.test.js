// ============================================================
// Startup Screen "welcome" with the Welcome Screen Add-on off: PinballY
// starts on the wheel, the last active Profile greeted, and the log says
// the Startup Screen fell back.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { readLoader } from "../support/loader_reader.js";
import { startupVeil } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const PICKER_Z = 6500;
const PAUSE_OVER_MS = 600;

test("a Welcome Screen turned off gives way to the wheel, as the log says", async () => {
    const fake = createFakePinballYHost();
    fake.addFolder(`${PROFILES_FOLDER}\\Alice`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "profilePicker";
    config.language = "en";
    config.startupScreen = "welcome";

    const { default: lang } = await import("../../common/core/i18n.js");
    await import("../../main.js");
    assert.deepEqual(startupVeil(fake), { shown: false }, "no veil");
    assert.deepEqual(readLoader(fake), { shown: false }, "no Loader");
    await settle();
    fake.advanceTime(PAUSE_OVER_MS);
    const pickerTexts = fake.drawingLayers().filter(layer => layer.zIndex === PICKER_Z && layer.alpha > 0).flatMap(layer => layer.texts());
    assert.ok(pickerTexts.includes(lang.profiles.greeting("Alice")), "the wheel, with the Profile Greeting");
    assert.deepEqual(fake.logLines().filter(line => line.includes("Startup Screen")),
        ["[Startup] The Welcome Screen Add-on is off; the Startup Screen falls back to \"wheel\"."]);
    assertNoErrorLogged(fake);
});
