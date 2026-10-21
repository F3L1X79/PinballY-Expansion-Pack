// ============================================================
// Quiet wheel and a Period Table launched from the startup Welcome Screen:
// the table lowered on the wheel is back at its own volume before the wheel
// moves to the Table of the Week and launches it, which is never lowered.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { WELCOME_SCREEN_OPEN_MS, choose } from "../welcome_screen/welcome_screen_reader.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const MEDIEVAL = { id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", audioVolume: 60 };
const MARS = { id: 2, configId: "Attack from Mars (Bally 1995)", title: "Attack from Mars", audioVolume: 90 };

test("the Table of the Week launched from the Welcome Screen finds the selected table back at its volume", async () => {
    // Wednesday 23 September 2026: its week starts Monday 21.
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 10, 0, 0), tables: [MEDIEVAL, MARS] });
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({ version: 1, notified: [] }));
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({
        version: 1,
        activeProfile: "Alice",
        tableOfTheDay: { configId: MEDIEVAL.configId, period: "2026-09-23" },
        tableOfTheWeek: { configId: MARS.configId, period: "2026-09-21" },
    }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    // The volumes PinballY has as the launch starts.
    const volumesAtLaunch = [];
    const playGame = mainWindow.playGame;
    mainWindow.playGame = game => {
        volumesAtLaunch.push([MEDIEVAL, MARS].map(table => fake.getGameInfo(table.configId).audioVolume));
        playGame(game);
    };
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["startupChoicePrompt", "profilePicker"].includes(key);
    config.language = "en";

    const { default: lang } = await import("../../common/core/i18n.js");
    await import("../../main.js");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    choose(fake, lang.welcomeScreen.periodCards.week.period);
    await settle();

    assert.deepEqual(fake.launches().map(game => game.configId), [MARS.configId]);
    assert.deepEqual(volumesAtLaunch, [[60, 90]], "both tables at their own volume as the launch starts");
    assert.deepEqual(fake.gameUpdates(), [
        { configId: MEDIEVAL.configId, changes: { audioVolume: 50 } },
        { configId: MEDIEVAL.configId, changes: { audioVolume: 60 } },
    ]);
    assertNoErrorLogged(fake);
});
