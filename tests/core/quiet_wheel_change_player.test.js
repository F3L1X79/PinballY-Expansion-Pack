// ============================================================
// Quiet wheel and Change Player: from the Welcome Screen opened at startup,
// through the Profile picker and the Welcome Screen of the new Profile, the
// table drops once and comes back once; from the main menu, a pick of the
// same Profile brings it back at once, another one hands over the same way.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { WELCOME_SCREEN_OPEN_MS, press, isWelcomeScreenOpen, choose } from "../welcome_screen/welcome_screen_reader.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const TABLES = [{ id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", audioVolume: 100 }];
const GLIDE_OVER_MS = 500;
const HANDOVER_OVER_MS = 200;

test("Change Player keeps one drop over the Welcome Screen, the Profile picker and the next Welcome Screen", async () => {
    const fake = createFakePinballYHost({ tables: TABLES });
    for (const name of ["Alice", "Bob"]) fake.addFolder(`${PROFILES}\\${name}`);
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Bob" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["startupChoicePrompt", "profilePicker"].includes(key);
    config.language = "en";

    const { default: lang } = await import("../../common/core/i18n.js");
    const { getProfileStore } = await import("../../common/profiles/profile_store.js");
    await import("../../main.js");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true);
    const drop = { configId: TABLES[0].configId, changes: { audioVolume: 50 } };
    const back = { configId: TABLES[0].configId, changes: { audioVolume: 100 } };

    choose(fake, lang.profiles.menuEntry);
    await settle();
    fake.advanceTime(HANDOVER_OVER_MS);
    press(fake, "Prev");
    fake.advanceTime(GLIDE_OVER_MS);
    press(fake, "Select");
    assert.equal(getProfileStore().getActiveProfile().name, "Alice");
    await settle();
    fake.advanceTime(HANDOVER_OVER_MS);
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true, "the new Profile's Welcome Screen");
    assert.deepEqual(fake.gameUpdates(), [drop], "one drop through the three screens");

    press(fake, "Exit");
    fake.advanceTime(HANDOVER_OVER_MS);
    assert.deepEqual(fake.gameUpdates(), [drop, back], "one return");

    // The same Profile from the main menu: no Welcome Screen follows.
    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    fake.selectMenuItem(lang.profiles.menuEntry);
    await settle();
    press(fake, "Select");
    assert.deepEqual(fake.gameUpdates(), [drop, back, drop, back], "back at once");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), false);

    // Another Profile from the main menu: its Welcome Screen follows.
    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    fake.selectMenuItem(lang.profiles.menuEntry);
    await settle();
    press(fake, "Next");
    fake.advanceTime(GLIDE_OVER_MS);
    press(fake, "Select");
    assert.equal(getProfileStore().getActiveProfile().name, "Bob");
    await settle();
    fake.advanceTime(HANDOVER_OVER_MS);
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true);
    assert.deepEqual(fake.gameUpdates(), [drop, back, drop, back, drop], "one drop through the picker and the Welcome Screen");
    assertNoErrorLogged(fake);
});
