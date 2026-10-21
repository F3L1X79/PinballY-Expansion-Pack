// ============================================================
// Quiet wheel and the Profile picker opened from the main menu, the Welcome
// Screen turned off: the table drops on open and comes back at once on Exit
// and on a pick, which only the Profile Greeting follows.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { press } from "../welcome_screen/welcome_screen_reader.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const TABLES = [{ id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", audioVolume: 100 }];
const GREETING_OVER_MS = 2500;

test("the Profile picker from the main menu lowers the table while open, back at once when nothing follows", async () => {
    const fake = createFakePinballYHost({ tables: TABLES });
    for (const name of ["Alice", "Bob"]) fake.addFolder(`${PROFILES}\\${name}`);
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Bob" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "profilePicker";
    config.language = "en";

    const { default: lang } = await import("../../common/core/i18n.js");
    const { getProfileStore } = await import("../../common/profiles/profile_store.js");
    await import("../../main.js");
    await settle();
    fake.advanceTime(GREETING_OVER_MS);
    assert.deepEqual(fake.gameUpdates(), [], "nothing lowered before the picker opens");
    const openPicker = async () => {
        fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
        fake.selectMenuItem(lang.profiles.menuEntry);
        await settle();
    };
    const drop = { configId: TABLES[0].configId, changes: { audioVolume: 50 } };
    const back = { configId: TABLES[0].configId, changes: { audioVolume: 100 } };

    await openPicker();
    assert.deepEqual(fake.gameUpdates(), [drop], "down on open");
    press(fake, "Exit");
    assert.deepEqual(fake.gameUpdates(), [drop, back], "back at once on Exit");

    await openPicker();
    press(fake, "Prev");
    press(fake, "Select");
    assert.equal(getProfileStore().getActiveProfile().name, "Alice");
    assert.deepEqual(fake.gameUpdates(), [drop, back, drop, back], "back at once on a pick the Welcome Screen does not follow");
    fake.advanceTime(GREETING_OVER_MS);
    assert.deepEqual(fake.gameUpdates(), [drop, back, drop, back], "the Profile Greeting changes no volume");
    assertNoErrorLogged(fake);
});
