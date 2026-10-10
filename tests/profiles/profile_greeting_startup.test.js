// ============================================================
// Startup Profile Greeting, through main.js on the fake PinballY globals,
// with the Welcome Screen turned off: it never shows, and the restored
// active Profile is greeted once, on the wheel, after a short pause, then
// the greeting fades out.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";
import { isWelcomeScreenOpen } from "../welcome_screen/welcome_screen_reader.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const PICKER_Z = 6500;
const PAUSE_OVER_MS = 600;
const GREETING_OVER_MS = 2500;

const pickerTexts = fake => fake.drawingLayers()
    .filter(layer => layer.zIndex === PICKER_Z && layer.alpha > 0)
    .flatMap(layer => layer.texts());

test("without the Welcome Screen, the active Profile is greeted once at startup", async () => {
    const fake = createFakePinballYHost();
    fake.addFolder(`${PROFILES_FOLDER}\\Alice`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "profilePicker";
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    await import("../../main.js");
    await settle();
    fake.advanceTime(0);
    assert.deepEqual(pickerTexts(fake), [], "not right away");

    fake.advanceTime(PAUSE_OVER_MS);
    assert.ok(pickerTexts(fake).includes(lang.profiles.greeting("Alice")), "greets the restored Profile");
    assert.equal(isWelcomeScreenOpen(fake), false, "no Welcome Screen");
    fake.advanceTime(GREETING_OVER_MS);
    assert.deepEqual(pickerTexts(fake), [], "then fades out");

    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    fake.closeMenu();
    await settle();
    fake.advanceTime(GREETING_OVER_MS);
    assert.deepEqual(pickerTexts(fake), [], "only once");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
