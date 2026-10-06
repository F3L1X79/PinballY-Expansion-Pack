// ============================================================
// The Player Level a Profile holds is never announced, through main.js on
// the fake PinballY globals: neither at startup nor after Change Player,
// even when the Achievement Toasts of that check raise it; a Guest's later
// Play brings its own Level Toast.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, levelToasts, allToasts, play, playedFor, errorLines, TABLES, HOUR, ALL_TOASTS_MS, levelToastOf, pickLastTables } from "./mastery_bar_scenario.js";

const [FIRST, SECOND, THIRD] = TABLES;

test("no Level Toast at startup or after Change Player, and a Guest gets its own", async () => {
    pickLastTables();
    // Played before this version: Achievements never announced, worth a level or more.
    const fake = await startScenario({
        addOns: ["achievements", "profilePicker"],
        active: "Alice",
        profiles: {
            Alice: { plays: { [FIRST.configId]: playedFor(600), [SECOND.configId]: playedFor(600) } },
            guest: { plays: { [THIRD.configId]: playedFor(600) } },
        },
    });
    fake.advanceTime(ALL_TOASTS_MS);
    assert.ok(allToasts(fake).length > 0, "Alice's Achievement Toasts at startup");
    assert.deepEqual(levelToasts(fake), [], "no Level Toast at startup");

    const { getProfileStore } = await import("../common/profile_store.js");
    const shownBefore = allToasts(fake).length;
    getProfileStore().switchTo("guest");
    fake.advanceTime(ALL_TOASTS_MS);
    assert.ok(allToasts(fake).length > shownBefore, "Guest's Achievement Toasts after Change Player");
    assert.deepEqual(levelToasts(fake), [], "no Level Toast after Change Player");

    // 1, 5 and 10 hours played: 85 points on top of Guest's 60, level 3.
    await play(fake, THIRD, 10 * HOUR);
    fake.advanceTime(ALL_TOASTS_MS);
    assert.deepEqual(levelToasts(fake), [levelToastOf(3)]);

    assert.deepEqual(errorLines(fake), []);
});
