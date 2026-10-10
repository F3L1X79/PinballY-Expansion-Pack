// ============================================================
// Startup Profile Greeting, through main.js on the fake PinballY globals,
// with the Welcome Screen on: the screen already greets the Profile by
// name, so no greeting shows at startup, neither over the screen nor
// after attract mode closed it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";
import { WELCOME_SCREEN_OPEN_MS, isWelcomeScreenOpen } from "../welcome_screen/welcome_screen_reader.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const PICKER_Z = 6500;

const pickerTexts = fake => fake.drawingLayers()
    .filter(layer => layer.zIndex === PICKER_Z && layer.alpha > 0)
    .flatMap(layer => layer.texts());

test("with the Welcome Screen on, no greeting shows at startup", async () => {
    const fake = createFakePinballYHost();
    fake.addFolder(`${PROFILES_FOLDER}\\Alice`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = key === "profilePicker" || key === "startupChoicePrompt";
    }
    config.language = "en";

    await import("../../main.js");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true);
    assert.deepEqual(pickerTexts(fake), [], "never over the Welcome Screen");

    fake.enterAttractMode();
    assert.equal(isWelcomeScreenOpen(fake), false, "attract mode closes it");
    fake.exitAttractMode();
    await settle();
    fake.advanceTime(2000);
    assert.equal(isWelcomeScreenOpen(fake), false, "it does not come back");
    assert.deepEqual(pickerTexts(fake), [], "nor does the greeting after it");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
