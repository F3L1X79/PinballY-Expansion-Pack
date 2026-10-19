// ============================================================
// Period Tables family: first play, Periods Played and Streaks on the Table
// of the Day and the Table of the Week, from the counters kept by
// common/tables/period_table.js. Writes nothing.
// - A Streak Achievement is unlocked by the longest Streak: a broken Streak never takes it back.
// ============================================================

import { ACHIEVEMENT_FAMILY, ACHIEVEMENT_RANK, countedAchievement, PROGRESS_UNIT, standaloneAchievement } from "../common/achievements/achievements.js";
import lang from "../common/core/i18n.js";
import { getTableOfTheDay, getTableOfTheWeek } from "../common/tables/period_table.js";

export function buildPeriodTableAchievements() {
    const { achievements: TEXT } = lang;
    const tableOfTheDay = getTableOfTheDay();
    const tableOfTheWeek = getTableOfTheWeek();

    // Each threshold also needs its title in every lang/ file. Each list is
    // its own ladder of Achievement Ranks.
    const dailyPeriodsPlayedThresholds = [10, 25, 50, 100];
    const weeklyPeriodsPlayedThresholds = [4, 10, 26, 52];
    const dailyStreakThresholds = [3, 7, 14, 30];
    const weeklyStreakThresholds = [4, 12];

    const achievements = [
        standaloneAchievement({
            id: "tableOfTheDayFirstPlay",
            family: ACHIEVEMENT_FAMILY.PERIOD_TABLES,
            rank: ACHIEVEMENT_RANK.BRONZE,
            getTitle: () => TEXT.dailyFirstPlayTitle(),
            getDescription: () => TEXT.dailyFirstPlayDescription(),
            checkUnlocked: () => tableOfTheDay.getLongestStreak() >= 1,
        }),
        standaloneAchievement({
            id: "tableOfTheWeekFirstPlay",
            family: ACHIEVEMENT_FAMILY.PERIOD_TABLES,
            rank: ACHIEVEMENT_RANK.BRONZE,
            getTitle: () => TEXT.weeklyFirstPlayTitle(),
            getDescription: () => TEXT.weeklyFirstPlayDescription(),
            checkUnlocked: () => tableOfTheWeek.getLongestStreak() >= 1,
        }),
    ];

    for (const days of dailyPeriodsPlayedThresholds) {
        achievements.push(countedAchievement({
            id: `tableOfTheDayPeriodsPlayed:${days}`,
            family: ACHIEVEMENT_FAMILY.PERIOD_TABLES,
            getTitle: () => TEXT.dailyPeriodsPlayedTitles[days],
            getDescription: () => TEXT.dailyPeriodsPlayedDescription(days),
            target: days,
            ladder: dailyPeriodsPlayedThresholds,
            unit: PROGRESS_UNIT.DAYS_PLAYED,
            getCurrent: tableOfTheDay.getPeriodsPlayed,
        }));
    }

    for (const weeks of weeklyPeriodsPlayedThresholds) {
        achievements.push(countedAchievement({
            id: `tableOfTheWeekPeriodsPlayed:${weeks}`,
            family: ACHIEVEMENT_FAMILY.PERIOD_TABLES,
            getTitle: () => TEXT.weeklyPeriodsPlayedTitles[weeks],
            getDescription: () => TEXT.weeklyPeriodsPlayedDescription(weeks),
            target: weeks,
            ladder: weeklyPeriodsPlayedThresholds,
            unit: PROGRESS_UNIT.WEEKS_PLAYED,
            getCurrent: tableOfTheWeek.getPeriodsPlayed,
        }));
    }

    for (const days of dailyStreakThresholds) {
        achievements.push(countedAchievement({
            id: `tableOfTheDayStreak:${days}`,
            family: ACHIEVEMENT_FAMILY.PERIOD_TABLES,
            getTitle: () => TEXT.dailyStreakTitles[days],
            getDescription: () => TEXT.dailyStreakDescription(days),
            target: days,
            ladder: dailyStreakThresholds,
            unit: PROGRESS_UNIT.DAYS_IN_A_ROW,
            getCurrent: tableOfTheDay.getStreak,
            getRecord: tableOfTheDay.getLongestStreak,
        }));
    }

    for (const weeks of weeklyStreakThresholds) {
        achievements.push(countedAchievement({
            id: `tableOfTheWeekStreak:${weeks}`,
            family: ACHIEVEMENT_FAMILY.PERIOD_TABLES,
            getTitle: () => TEXT.weeklyStreakTitles[weeks],
            getDescription: () => TEXT.weeklyStreakDescription(weeks),
            target: weeks,
            ladder: weeklyStreakThresholds,
            unit: PROGRESS_UNIT.WEEKS_IN_A_ROW,
            getCurrent: tableOfTheWeek.getStreak,
            getRecord: tableOfTheWeek.getLongestStreak,
        }));
    }

    return achievements;
}
