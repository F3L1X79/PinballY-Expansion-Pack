// ============================================================
// The plunger (PinballY's Launch command, the Launch Ball button) runs
// the highlighted choice of the drawn screens as Select does, as it does
// in PinballY's native menus: on the Welcome Screen, a Period Table card
// launches its table, and on the Profile Stats a button does its job.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";
import { WELCOME_SCREEN_OPEN_MS, press, isWelcomeScreenOpen, highlightedCard } from "./welcome_screen_reader.js";
import { isProfileStatsOpen, openProfileStats, highlighted } from "../stats/profile_stats_reader.js";

const NOW = new Date(2026, 8, 23, 10, 0, 0);

const TABLES = [
    { id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", lastPlayed: new Date(2025, 0, 1) },
    { id: 2, configId: "Attack from Mars (Bally 1995)", title: "Attack from Mars", lastPlayed: new Date(2026, 5, 1) },
];

test("the plunger runs the highlighted choice of the Welcome Screen and of the Profile Stats", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: TABLES });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = ["customMenuCommands", "startupChoicePrompt", "achievements"].includes(key);
    }
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    await import("../../main.js");
    await settle();

    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    const dayCard = lang.welcomeScreen.periodCards.day.period;
    for (let guard = 0; guard < 10 && highlightedCard(fake) !== dayCard; guard++) press(fake, "Next");
    press(fake, "Launch");
    assert.equal(isWelcomeScreenOpen(fake), false, "the Welcome Screen closes");
    assert.deepEqual(fake.launches().map(game => game.title), ["Medieval Madness"], "and launches the Table of the Day");
    fake.gameStarted(fake.launches()[0]);
    fake.gameOver(fake.launches()[0]);
    await settle();

    openProfileStats(fake, lang);
    const achievements = lang.profileStats.buttons.achievements;
    for (let guard = 0; guard < 10 && highlighted(fake) !== achievements; guard++) press(fake, "Next");
    press(fake, "Launch");
    assert.equal(isProfileStatsOpen(fake), false, "the Profile Stats give way to the Achievement List");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
