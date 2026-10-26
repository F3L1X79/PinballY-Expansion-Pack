// ============================================================
// Quiet wheel and the startup Welcome Screen's pause before it shows: the
// table is lowered from the screen's turn, and a native menu during the
// pause brings it back at once; once the menu closes, the screen shows
// after the pause again, with the table lowered again.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { isWelcomeScreenOpen, welcomeScreenLayerCount, WELCOME_SCREEN_PAUSE_MS, WELCOME_SCREEN_OPEN_MS } from "../welcome_screen/welcome_screen_reader.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const TABLES = [{ id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", audioVolume: 100 }];

test("a menu during the startup Welcome Screen's pause brings the table back at once", async () => {
    const fake = createFakePinballYHost({ tables: TABLES });
    for (const name of ["Alice", "Bob"]) fake.addFolder(`${PROFILES}\\${name}`);
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Bob" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["startupChoicePrompt", "profilePicker"].includes(key);
    config.language = "en";
    config.startupScreen = "welcome";

    await import("../../main.js");
    await settle();
    const drop = { configId: TABLES[0].configId, changes: { audioVolume: 50 } };
    const back = { configId: TABLES[0].configId, changes: { audioVolume: 100 } };
    assert.deepEqual(fake.gameUpdates(), [drop], "lowered from the screen's turn");
    assert.equal(welcomeScreenLayerCount(fake), 0, "still in its pause");

    fake.openMainMenu();
    assert.deepEqual(fake.gameUpdates(), [drop, back], "a menu: back at once");
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(welcomeScreenLayerCount(fake), 0, "not drawn over the menu");
    fake.closeMenu();
    await settle();
    fake.advanceTime(WELCOME_SCREEN_PAUSE_MS - 1);
    assert.equal(welcomeScreenLayerCount(fake), 0, "the startup screen waits its pause again");
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true, "the screen shows once back on the wheel");
    assert.deepEqual(fake.gameUpdates(), [drop, back, drop], "lowered again with it");
    assertNoErrorLogged(fake);
});
