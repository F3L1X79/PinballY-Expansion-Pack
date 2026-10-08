// ============================================================
// Player Level: turns a Profile's Notified Achievements into its level,
// worked out afresh each time from the Achievements that still exist, at
// their current Achievement Rank. Pure: takes the Notified ids and the
// current Achievements, returns { level, points, from, to }. For a Child
// Profile, also takes the Achievements a Profile that is not a child would
// have with the same collection, and scales the points up by what those
// are worth over the current ones, so the child climbs the same curve as
// fast for the same share of play. Nothing is persisted.
// ============================================================

import { ACHIEVEMENT_RANK } from "./achievements.js";

const RANK_POINTS = Object.freeze({
    [ACHIEVEMENT_RANK.BRONZE]: 10,
    [ACHIEVEMENT_RANK.SILVER]: 25,
    [ACHIEVEMENT_RANK.GOLD]: 50,
    [ACHIEVEMENT_RANK.PLATINUM]: 100,
});
// The first level of each Rank's metal on the level pip; from the last,
// Platinum for good.
const METAL_FIRST_LEVELS = Object.freeze([
    [ACHIEVEMENT_RANK.BRONZE, 1],
    [ACHIEVEMENT_RANK.SILVER, 10],
    [ACHIEVEMENT_RANK.GOLD, 20],
    [ACHIEVEMENT_RANK.PLATINUM, 30],
]);
const FIRST_LEVEL_COST = 50;
const LEVEL_COST_STEP = 25;

// Level 2 at 50 points, then each level costs 25 more than the one before;
// from and to are the points of the current and next level.
export function playerLevelOf(points) {
    let level = 1;
    let from = 0;
    let cost = FIRST_LEVEL_COST;
    while (points >= from + cost) {
        from += cost;
        cost += LEVEL_COST_STEP;
        level++;
    }
    return { level, points, from, to: from + cost };
}

// The level pip's metal: the Rank and how far into it the level is, from
// 0 at its first level to 1 at the next Rank's (Platinum never ends, so it
// reaches 1 at its own first level plus ten and stays there).
export function playerLevelMetalOf(level) {
    let index = 0;
    while (index + 1 < METAL_FIRST_LEVELS.length && level >= METAL_FIRST_LEVELS[index + 1][1]) index++;
    const [rank, first] = METAL_FIRST_LEVELS[index];
    const next = index + 1 < METAL_FIRST_LEVELS.length ? METAL_FIRST_LEVELS[index + 1][1] : first + 10;
    return { rank, progress: Math.min(1, (level - first) / (next - first)) };
}

const pointsOf = achievements =>
    achievements.reduce((sum, achievement) => sum + (RANK_POINTS[achievement.rank] || 0), 0);

// A gone Achievement counts nothing; an Unlock later lost keeps its points.
// nonChildAchievements: only counted, null for a Profile that is not a child.
export function getPlayerLevel(notifiedIds, achievements, nonChildAchievements = null) {
    const notified = new Set(notifiedIds);
    const points = pointsOf(achievements.filter(achievement => notified.has(achievement.id)));
    const currentWorth = pointsOf(achievements);
    if (nonChildAchievements === null || currentWorth === 0) return playerLevelOf(points);
    return playerLevelOf(Math.floor(points * pointsOf(nonChildAchievements) / currentWorth));
}
