// ============================================================
// The Welcome Screen's day card and the custom main menu entry, started
// through main.js on the fake PinballY globals, launch the same Table of
// the Day, and a Play launched from either counts once in the day Streak,
// while a game under a minute does not count.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";
import { WELCOME_SCREEN_OPEN_MS, choose } from "../welcome_screen/welcome_screen_reader.js";

const NOW = new Date(2026, 8, 23, 10, 0, 0);

const TABLES = [
    { id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", lastPlayed: new Date(2025, 0, 1) },
    { id: 2, configId: "Attack from Mars (Bally 1995)", title: "Attack from Mars", lastPlayed: new Date(2026, 5, 1) },
    { id: 3, configId: "Theatre of Magic (Bally 1995)", title: "Theatre of Magic", lastPlayed: new Date(2026, 7, 1) },
];

const ADD_ONS_UNDER_TEST = ["customMenuCommands", "startupChoicePrompt"];

test("the Welcome Screen and the main menu launch the same Table of the Day", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: TABLES });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    }
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    const { getTableOfTheDay } = await import("../../common/period_table.js");
    await import("../../main.js");
    await settle();

    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    choose(fake, lang.welcomeScreen.periodCards.day.period);
    const [firstLaunch] = fake.launches();
    fake.gameStarted(firstLaunch);
    fake.advanceTime(59 * 1000);
    fake.gameOver(firstLaunch);
    assert.equal(getTableOfTheDay().getStreak(), 0, "a game under a minute is not a Play");

    fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
    fake.selectMenuItem(lang.customMenuLabels.tableOfTheDay);
    const secondLaunch = fake.launches()[1];
    fake.gameStarted(secondLaunch);
    fake.advanceTime(60 * 1000);
    fake.gameOver(secondLaunch);

    assert.equal(firstLaunch.configId, "Medieval Madness (Williams 1997)");
    assert.equal(secondLaunch.configId, firstLaunch.configId);
    assert.equal(getTableOfTheDay().getStreak(), 1);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
