// ============================================================
// The Random Game Achievements follow the Add-ons that offer a Random Game,
// through main.js: with the Welcome Screen and Menu commands off, the main
// menu's random table entry alone keeps them.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const ADD_ONS_UNDER_TEST = ["randomGame", "achievements"];

test("with only the main menu's random table offering a Random Game, its Achievements are there", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 29, 20, 0, 0) });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";

    await import("../../main.js");
    await settle();
    const { getAllAchievements } = await import("../../addons/achievements_engine.js");

    const ids = getAllAchievements().map(achievement => achievement.id);
    assert.deepEqual(ids.filter(id => id.startsWith("randomGames:")),
        ["randomGames:10", "randomGames:25", "randomGames:50", "randomGames:100"]);
    assertNoErrorLogged(fake);
});
