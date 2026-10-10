// ============================================================
// Startup Profile Greeting and a drawn screen, through main.js on the
// fake PinballY globals, with the Welcome Screen turned off: the
// Achievement List chosen in the main Drawn Menu during the pause holds
// the greeting, which comes once the player is back on the wheel.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { isDrawnMenuShown, press, chooseEntry, openMainMenu } from "./drawn_menu_reader.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const PICKER_Z = 6500;
const PAUSE_OVER_MS = 600;
const ADD_ONS_UNDER_TEST = ["profilePicker", "drawnMenus", "achievements"];

const pickerTexts = fake => fake.drawingLayers()
    .filter(layer => layer.zIndex === PICKER_Z && layer.alpha > 0)
    .flatMap(layer => layer.texts());

test("the startup greeting waits for the Achievement List opened from the main Drawn Menu", async () => {
    const fake = createFakePinballYHost();
    fake.addFolder(`${PROFILES_FOLDER}\\Alice`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";

    const { default: lang } = await import("../common/i18n.js");
    const greeting = lang.profiles.greeting("Alice");
    await import("../main.js");
    await settle();
    fake.advanceTime(0);
    openMainMenu(fake);
    chooseEntry(fake, lang.achievementList.menuEntry);
    await settle();
    assert.ok(!isDrawnMenuShown(fake), "the list replaced the menu");

    fake.advanceTime(PAUSE_OVER_MS);
    assert.ok(!pickerTexts(fake).includes(greeting), "not over the Achievement List");

    // Exit goes back to the main menu, then to the wheel.
    press(fake, "Exit");
    assert.equal(fake.executedCommands().at(-1), globalThis.command.ShowMainMenu);
    // PinballY opens the main menu on ShowMainMenu.
    openMainMenu(fake);
    await settle();
    assert.ok(isDrawnMenuShown(fake));
    fake.advanceTime(PAUSE_OVER_MS);
    assert.ok(!pickerTexts(fake).includes(greeting), "not under the main menu");
    press(fake, "Exit");
    await settle();
    fake.advanceTime(PAUSE_OVER_MS);
    assert.ok(pickerTexts(fake).includes(greeting), "greets back on the wheel");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
