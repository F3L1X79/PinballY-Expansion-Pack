// ============================================================
// Startup Profile Greeting and an open Drawn Menu, through main.js on the
// fake PinballY globals, with the Welcome Screen turned off: a main menu
// drawn during the pause holds the greeting, which comes once the menu
// is closed, after its own pause.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";
import { isDrawnMenuShown, press, openMainMenu } from "../drawn_menu/drawn_menu_reader.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const PICKER_Z = 6500;
const PAUSE_OVER_MS = 600;

const pickerTexts = fake => fake.drawingLayers()
    .filter(layer => layer.zIndex === PICKER_Z && layer.alpha > 0)
    .flatMap(layer => layer.texts());

test("the startup greeting waits for an open Drawn Menu", async () => {
    const fake = createFakePinballYHost();
    fake.addFolder(`${PROFILES_FOLDER}\\Alice`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "profilePicker" || key === "drawnMenus";
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    const greeting = lang.profiles.greeting("Alice");
    await import("../../main.js");
    await settle();
    fake.advanceTime(0);
    openMainMenu(fake);
    assert.ok(isDrawnMenuShown(fake));

    fake.advanceTime(PAUSE_OVER_MS);
    assert.ok(!pickerTexts(fake).includes(greeting), "not under the menu");

    press(fake, "Exit");
    await settle();
    fake.advanceTime(PAUSE_OVER_MS);
    assert.ok(pickerTexts(fake).includes(greeting), "greets once the menu is closed");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
