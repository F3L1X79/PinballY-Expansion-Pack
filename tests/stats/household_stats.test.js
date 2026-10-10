// ============================================================
// The Household Stats' table, through main.js on the fake PinballY
// globals: the active Profile's column first, then the Profile picker's
// order without Guest; each value as that Profile's own Profile Stats show
// it, a Profile with no Play showing zeros; the best value of each line in
// gold, ties included, none on an all-zero line; Next / Prev move the halo
// from column to column with wrapping, and no button reaches the wheel.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold, errorLines, played, PROFILES, DEFAULT_AVATAR, NAVIGATION_SOUND, HOUR, MEDIEVAL, MARS, THEATRE } from "./household_stats_scenario.js";
import { openProfileStats, playerLevel, buttons, press } from "./profile_stats_reader.js";
import { openHouseholdStats, columns, columnNames, labels, lineValues, goldOn, highlightedColumn, isHouseholdStatsOpen } from "./household_stats_reader.js";

// Past every toast a Profile switch brings.
const ALL_TOASTS_MS = 600000;

test("the Household side by side, the best of each line in gold", async () => {
    const { fake, lang, profileStore } = await startHousehold({
        profiles: {
            Alice: {
                avatar: true,
                plays: { [MEDIEVAL.configId]: played(3, 2 * HOUR), [MARS.configId]: played(1, 600) },
                playLog: ["2026-09-21T21:00:00", "2026-09-22T21:00:00"],
            },
            Bob: { plays: { [THEATRE.configId]: played(4, HOUR) } },
            Zoe: {},
        },
    });
    // Each Profile's own Profile Stats, once its Achievements are Notified.
    const own = {};
    for (const name of ["Alice", "Zoe", "Bob"]) {
        profileStore.switchTo(name);
        fake.advanceTime(ALL_TOASTS_MS);
        openProfileStats(fake, lang);
        own[name] = { level: playerLevel(fake, lang.profileStats).level, achievements: buttons(fake)[0].count };
        press(fake, "Exit");
    }

    openHouseholdStats(fake, lang);

    assert.deepEqual(columnNames(fake), ["Bob", "Alice", "Zoe"], "the active Profile first, then the picker's order, no Guest");
    assert.deepEqual(columns(fake).map(column => column.avatar), [DEFAULT_AVATAR, `${PROFILES}\\Alice\\avatar.png`, DEFAULT_AVATAR]);
    assert.deepEqual(labels(fake), [
        "Player Level", "Collection Mastery", "Achievements unlocked", "Games played", "Total time", "Daily Streak", "Challenges completed",
    ]);
    assert.deepEqual(lineValues(fake, "Player Level"), [own.Bob.level, own.Alice.level, own.Zoe.level]);
    assert.deepEqual(lineValues(fake, "Achievements unlocked"), [own.Bob.achievements, own.Alice.achievements, own.Zoe.achievements]);
    assert.deepEqual(columns(fake).map(column => column.cells["Collection Mastery"].texts), [["1/4", "0"], ["2/4", "0"], ["0/4", "0"]],
        "the progress toward the next Collection Tier, then the tier in its square");
    assert.deepEqual(goldOn(fake, "Collection Mastery"), ["Alice"], "by tier, then progress");
    assert.deepEqual(lineValues(fake, "Games played"), ["4", "4", "0"]);
    assert.deepEqual(lineValues(fake, "Total time"), ["1 h 00", "2 h 10", "0 h 00"]);
    assert.deepEqual(lineValues(fake, "Daily Streak"), ["0", "2", "0"]);
    assert.deepEqual(lineValues(fake, "Challenges completed"), ["0/0", "0/0", "0/0"]);

    assert.deepEqual(goldOn(fake, "Games played"), ["Bob", "Alice"], "a tie is gold on both");
    assert.deepEqual(goldOn(fake, "Total time"), ["Alice"]);
    assert.deepEqual(goldOn(fake, "Daily Streak"), ["Alice"]);
    assert.deepEqual(goldOn(fake, "Challenges completed"), [], "no gold where nobody has anything");
    assert.deepEqual(goldOn(fake, "Player Level"), ["Alice"]);

    assert.equal(highlightedColumn(fake), "Bob");
    const soundsBefore = fake.soundsPlayed();
    assert.ok(press(fake, "Next").defaultPrevented);
    assert.equal(highlightedColumn(fake), "Alice");
    press(fake, "Prev");
    press(fake, "Prev");
    assert.equal(highlightedColumn(fake), "Zoe", "wrapping from the first column to the last");
    press(fake, "Next");
    assert.equal(highlightedColumn(fake), "Bob", "and back");
    assert.deepEqual(fake.soundsPlayed(), [...soundsBefore, ...Array(4).fill(NAVIGATION_SOUND)], "PinballY's navigation sound on each move");

    for (const command of ["Select", "Launch", "Info"]) assert.ok(press(fake, command).defaultPrevented, `${command} never reaches the wheel`);
    assert.ok(isHouseholdStatsOpen(fake), "Select does nothing yet");
    assert.equal(highlightedColumn(fake), "Bob");
    assert.deepEqual(errorLines(fake), []);
});
