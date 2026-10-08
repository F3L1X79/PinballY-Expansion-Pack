// ============================================================
// Adult Tables added while PinballY runs, through main.js on the fake
// PinballY globals: they scale a Child Profile's points up to a higher
// Player Level, which the Profile Stats show, but no Level Toast comes
// from that alone.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startScenario, levelToasts, play, errorLines, TABLES, ADULT_TABLES, ALL_TOASTS_MS, pickLastTables,
} from "./mastery_bar_scenario.js";
import { openProfileStats, playerLevel, press } from "./profile_stats_reader.js";
import lang from "../common/i18n.js";

const [FIRST] = TABLES;
// Shorter than a Play: a launch by mistake, which still runs a check.
const MISTAKEN_LAUNCH_SECONDS = 30;

function shownLevel(fake) {
    openProfileStats(fake, lang);
    const { level } = playerLevel(fake, lang.profileStats);
    press(fake, "Exit");
    return level;
}

test("Adult Tables added between two checks never bring a Level Toast by themselves", async () => {
    pickLastTables();
    // Four Seasons, Mirror Hour, Grand Return and Rage Quit: 110 points of
    // its own, scaled to 116 (1890 / 1790) without Adult Tables, level 2.
    const fake = await startScenario({
        addOns: ["achievements", "profilePicker"],
        active: "Kid",
        profiles: { Kid: { isChild: true, notified: ["fourSeasons", "mirrorHour", "grandReturn", "rageQuit"] } },
    });
    fake.advanceTime(ALL_TOASTS_MS);
    assert.equal(shownLevel(fake), "2");

    // Scaled to 125 (2045 / 1790): level 3.
    fake.setTables([...TABLES, ...ADULT_TABLES]);
    await play(fake, FIRST, MISTAKEN_LAUNCH_SECONDS);
    fake.advanceTime(ALL_TOASTS_MS);
    assert.equal(shownLevel(fake), "3");
    assert.deepEqual(levelToasts(fake), []);

    assert.deepEqual(errorLines(fake), []);
});
