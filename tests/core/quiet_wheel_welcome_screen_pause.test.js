// ============================================================
// Quiet wheel and the Welcome Screen's pause before it shows: the table is
// lowered from the screen's turn, and a launch, a native menu or attract
// mode during the pause brings it back at once; once the menu closes, the
// screen shows with the table lowered again.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { press, isWelcomeScreenOpen, WELCOME_SCREEN_OPEN_MS } from "../welcome_screen/welcome_screen_reader.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const TABLES = [{ id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", audioVolume: 100 }];
const GREETING_OVER_MS = 2500;
const HANDOVER_OVER_MS = 200;

test("a launch, a menu or attract mode during the Welcome Screen's pause brings the table back at once", async () => {
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
    const drop = { configId: TABLES[0].configId, changes: { audioVolume: 50 } };
    const back = { configId: TABLES[0].configId, changes: { audioVolume: 100 } };
    const startPause = async () => {
        fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
        fake.selectMenuItem(lang.welcomeScreen.menuEntry);
        await settle();
        assert.equal(isWelcomeScreenOpen(fake), false, "still in its pause");
    };

    await startPause();
    assert.deepEqual(fake.gameUpdates(), [drop], "lowered from the screen's turn");
    fake.fire("launchoverlayshow", { game: fake.getGameInfo(TABLES[0].configId) });
    assert.deepEqual(fake.gameUpdates(), [drop, back], "a launch: back at once");
    fake.fire("gamestarted", { game: fake.getGameInfo(TABLES[0].configId) });
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), false, "the screen does not show after the game");

    await startPause();
    fake.openMainMenu();
    assert.deepEqual(fake.gameUpdates(), [drop, back, drop, back], "a menu: back at once");
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    fake.closeMenu();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true, "the screen shows once back on the wheel");
    assert.deepEqual(fake.gameUpdates(), [drop, back, drop, back, drop], "lowered again with it");
    press(fake, "Exit");
    fake.advanceTime(HANDOVER_OVER_MS);

    await startPause();
    fake.enterAttractMode();
    const updates = [drop, back, drop, back, drop, back, drop, back];
    assert.deepEqual(fake.gameUpdates(), updates, "attract mode: back at once");
    fake.advanceTime(HANDOVER_OVER_MS);
    assert.deepEqual(fake.gameUpdates(), updates);
    assertNoErrorLogged(fake);
});
