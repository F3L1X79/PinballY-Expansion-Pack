// ============================================================
// A Period Table launched from the Welcome Screen or the main menu
// becomes the table selected on the wheel before it starts, so the wheel
// is on it when the game ends; when the current filter leaves it out, the
// wheel goes back to all tables to show it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { WELCOME_SCREEN_OPEN_MS, choose } from "./welcome_screen_reader.js";

const NOW = new Date(2026, 8, 23, 10, 0, 0);

const TABLES = [
    { id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", lastPlayed: new Date(2026, 7, 1) },
    { id: 2, configId: "Attack from Mars (Bally 1995)", title: "Attack from Mars", lastPlayed: new Date(2026, 5, 1) },
    { id: 3, configId: "Theatre of Magic (Bally 1995)", title: "Theatre of Magic", lastPlayed: null },
    { id: 4, configId: "Godzilla (Stern 2021)", title: "Godzilla", lastPlayed: new Date(2026, 6, 1) },
];

test("a launched Period Table becomes the table selected on the wheel", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: TABLES });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = ["customMenuCommands", "startupChoicePrompt"].includes(key);
    }
    config.language = "en";

    const { default: lang } = await import("../common/i18n.js");
    await import("../main.js");
    await settle();
    const current = () => fake.getCurrentTable().title;
    const playOut = game => {
        fake.gameStarted(game);
        fake.advanceTime(60 * 1000);
        fake.gameOver(game);
    };

    assert.equal(current(), "Medieval Madness");
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    choose(fake, lang.welcomeScreen.periodCards.day.period);
    const [dayLaunch] = fake.launches();
    assert.equal(dayLaunch.title, "Theatre of Magic");
    assert.equal(current(), "Theatre of Magic", "the Welcome Screen's card selects it on the wheel");
    playOut(dayLaunch);
    await settle();
    assert.equal(current(), "Theatre of Magic", "and the wheel is on it after the game");

    fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
    fake.selectMenuItem(lang.customMenuLabels.tableOfTheWeek);
    const weekLaunch = fake.launches()[1];
    assert.equal(current(), weekLaunch.title, "the main menu entry selects it on the wheel too");
    playOut(weekLaunch);
    await settle();

    fake.setWheelTables(["Godzilla (Stern 2021)"], { filterId: "Manufacturer.Stern" });
    fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
    fake.selectMenuItem(lang.customMenuLabels.tableOfTheDay);
    assert.equal(fake.launches()[2].title, "Theatre of Magic");
    assert.equal(fake.currentFilterId(), "All", "a filter that leaves it out gives way to all tables");
    assert.equal(current(), "Theatre of Magic");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
