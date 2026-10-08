// ============================================================
// With the session stats tracker Add-on off, the Sessions Achievement
// Family is absent as a whole, the Daily Streak Achievements included,
// even though the Daily Streak itself only needs the Play Log.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { ACHIEVEMENT_FAMILY } from "../common/achievements.js";

test("no Sessions Achievement without the session stats tracker Add-on", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 8, 10, 0, 0) });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["customMenuCommands", "achievements"].includes(key);
    config.language = "en";

    await import("../main.js");
    await settle();
    const { getAllAchievements } = await import("../addons/achievements_engine.js");

    const achievements = getAllAchievements();
    assert.deepEqual(achievements.filter(({ family }) => family === ACHIEVEMENT_FAMILY.SESSIONS).map(({ id }) => id), []);
    // The other families are still there.
    assert.ok(achievements.some(({ id }) => id === "tableOfTheDayStreak:3"));
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
