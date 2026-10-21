// ============================================================
// Quiet wheel on a bare-wheel startup: the Profile Greeting alone changes no
// volume; the Welcome Screen opened from the main menu lowers the table once
// and brings it back once on close. A silent table stays silent.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { press, isWelcomeScreenOpen, openFromMainMenu } from "../welcome_screen/welcome_screen_reader.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const TABLES = [
    { id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", audioVolume: 0 },
    { id: 2, configId: "Attack from Mars (Bally 1995)", title: "Attack from Mars", audioVolume: 100 },
];
const GREETING_OVER_MS = 2500;
const HANDOVER_OVER_MS = 200;

test("the bare wheel changes no volume, the Welcome Screen from the main menu lowers it once", async () => {
    const fake = createFakePinballYHost({ tables: TABLES });
    for (const name of ["Alice", "Bob"]) fake.addFolder(`${PROFILES}\\${name}`);
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Bob" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["startupChoicePrompt", "profilePicker"].includes(key);
    config.language = "en";
    config.startupScreen = "wheel";

    const { default: lang } = await import("../../common/core/i18n.js");
    await import("../../main.js");
    await settle();
    fake.advanceTime(GREETING_OVER_MS);
    assert.deepEqual(fake.gameUpdates(), [], "no update() for the Profile Greeting alone");

    await openFromMainMenu(fake, lang.welcomeScreen.menuEntry);
    assert.equal(isWelcomeScreenOpen(fake), true);
    const lowered = [{ configId: TABLES[0].configId, changes: { audioVolume: 0 } }];
    assert.deepEqual(fake.gameUpdates(), lowered, "one drop on open, 0 stays 0");

    press(fake, "Exit");
    fake.advanceTime(HANDOVER_OVER_MS);
    assert.deepEqual(fake.gameUpdates(), [...lowered, { configId: TABLES[0].configId, changes: { audioVolume: 0 } }], "one return on close");
    assert.ok(fake.logLines().some(line => line.startsWith("[QuietWheel] Restored \"Medieval Madness\"")), "the return logged");
    assertNoErrorLogged(fake);
});
