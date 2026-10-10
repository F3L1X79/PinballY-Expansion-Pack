// ============================================================
// Achievement Progress of the Period Tables Achievements, through main.js
// on the fake PinballY globals: a Streak Achievement the record reached
// stays Unlocked when the Streak breaks; a missing one follows the current
// Streak (0 after a break, then 1 on the next play), never the record;
// Periods Played Achievements count every Period, for the day and the
// week; the first-play Achievements (a target of 1) show none.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, table, PROFILES_FOLDER } from "./achievement_progress_scenario.js";

const TABLE_OF_THE_DAY = table(1, "Medieval Madness", "Williams", 1997);
const TABLE_OF_THE_WEEK = table(2, "Attack from Mars", "Bally", 1995);

test("Streak Achievements stay Unlocked after a break, missing ones show the current Streak", async () => {
    const { fake, lang, play, readShown, unlockedRow, missingRow } = await startScenario({
        // Wednesday: its week started on Monday 21 September.
        now: new Date(2026, 8, 23, 10, 0, 0),
        tables: [TABLE_OF_THE_DAY, TABLE_OF_THE_WEEK],
        files: {
            [`${PROFILES_FOLDER}\\cabinet.json`]: {
                version: 1, activeProfile: "guest",
                tableOfTheDay: { configId: TABLE_OF_THE_DAY.configId, period: "2026-09-23" },
                tableOfTheWeek: { configId: TABLE_OF_THE_WEEK.configId, period: "2026-09-21" },
            },
            // The day Streak broke on the 21st, after a 12-day record; the
            // week Streak still runs from last week.
            [`${PROFILES_FOLDER}\\guest\\profile.json`]: {
                version: 1, notified: [], plays: {},
                streaks: {
                    tableOfTheDay: { current: 5, longest: 12, lastPeriod: "2026-09-20", periodsPlayed: 40 },
                    tableOfTheWeek: { current: 2, longest: 2, lastPeriod: "2026-09-14", periodsPlayed: 9 },
                },
            },
        },
    });
    const ACHIEVEMENT = lang.achievements;
    const streakOfThirty = ACHIEVEMENT.dailyStreakTitles[30];

    assert.deepEqual(readShown([ACHIEVEMENT.dailyStreakTitles[7], streakOfThirty]), [
        // The 12-day record keeps 7 days in a row Unlocked.
        unlockedRow(ACHIEVEMENT.dailyStreakTitles[7]),
        // A broken Streak is back to 0 for a missing Achievement, whatever the record.
        missingRow(streakOfThirty, "daysInARow", 0, 30),
    ]);

    await play(TABLE_OF_THE_DAY);
    const daysPlayed = [10, 25, 50, 100].map(days => ACHIEVEMENT.dailyPeriodsPlayedTitles[days]);
    const weeksPlayed = [4, 10, 26, 52].map(weeks => ACHIEVEMENT.weeklyPeriodsPlayedTitles[weeks]);
    const dayStreaks = [3, 7, 14, 30].map(days => ACHIEVEMENT.dailyStreakTitles[days]);
    const weekStreaks = [4, 12].map(weeks => ACHIEVEMENT.weeklyStreakTitles[weeks]);
    assert.deepEqual(readShown([
        ACHIEVEMENT.dailyFirstPlayTitle(), ACHIEVEMENT.weeklyFirstPlayTitle(), ...daysPlayed, ...weeksPlayed, ...dayStreaks, ...weekStreaks,
    ]), [
        unlockedRow(ACHIEVEMENT.dailyFirstPlayTitle()),
        unlockedRow(ACHIEVEMENT.weeklyFirstPlayTitle()),
        unlockedRow(daysPlayed[0]),
        unlockedRow(daysPlayed[1]),
        missingRow(daysPlayed[2], "daysPlayed", 41, 50),
        missingRow(daysPlayed[3], "daysPlayed", 41, 100),
        unlockedRow(weeksPlayed[0]),
        missingRow(weeksPlayed[1], "weeksPlayed", 9, 10),
        missingRow(weeksPlayed[2], "weeksPlayed", 9, 26),
        missingRow(weeksPlayed[3], "weeksPlayed", 9, 52),
        unlockedRow(dayStreaks[0]),
        unlockedRow(dayStreaks[1]),
        missingRow(dayStreaks[2], "daysInARow", 1, 14),
        missingRow(dayStreaks[3], "daysInARow", 1, 30),
        missingRow(weekStreaks[0], "weeksInARow", 2, 4),
        missingRow(weekStreaks[1], "weeksInARow", 2, 12),
    ]);

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
