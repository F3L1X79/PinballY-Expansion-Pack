// ============================================================
// Quiet wheel during the hand-over after the last screen closes: a launch,
// a native menu or attract mode starting then brings the table back at once
// instead of after the delay.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { press, isWelcomeScreenOpen, openFromMainMenu } from "../welcome_screen/welcome_screen_reader.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const TABLES = [{ id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", audioVolume: 100 }];
const GREETING_OVER_MS = 2500;
const HANDOVER_OVER_MS = 200;

test("a launch, a menu or attract mode during the hand-over brings the table back at once", async () => {
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
    const interruptions = {
        launch: () => fake.playGame(fake.getGameInfo(TABLES[0].configId)),
        menu: () => fake.openMainMenu(),
        attract: () => fake.enterAttractMode(),
    };

    const expected = [];
    for (const [name, interrupt] of Object.entries(interruptions)) {
        await openFromMainMenu(fake, lang.welcomeScreen.menuEntry);
        assert.equal(isWelcomeScreenOpen(fake), true, name);
        press(fake, "Exit");
        expected.push(drop);
        assert.deepEqual(fake.gameUpdates(), expected, `${name}: still lowered in the hand-over`);
        interrupt();
        expected.push(back);
        assert.deepEqual(fake.gameUpdates(), expected, `${name}: back at once`);
        fake.advanceTime(HANDOVER_OVER_MS);
        assert.deepEqual(fake.gameUpdates(), expected, `${name}: nothing more after the delay`);
        if (name === "launch") {
            fake.gameStarted(fake.getGameInfo(TABLES[0].configId));
            fake.gameOver(fake.getGameInfo(TABLES[0].configId));
        }
        if (name === "menu") fake.closeMenu();
        if (name === "attract") fake.exitAttractMode();
        await settle();
    }
    assertNoErrorLogged(fake);
});
