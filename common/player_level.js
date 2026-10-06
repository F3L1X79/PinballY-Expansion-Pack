// ============================================================
// Player Level: turns a Profile's Notified Achievements into its level,
// worked out afresh each time from the Achievements that still exist, at
// their current Achievement Rank. Pure: takes the Notified ids and the
// current Achievements, returns { level, points, from, to }. Nothing is
// persisted.
// ============================================================

import { ACHIEVEMENT_RANK } from "./achievements.js";

const RANK_POINTS = Object.freeze({
    [ACHIEVEMENT_RANK.BRONZE]: 10,
    [ACHIEVEMENT_RANK.SILVER]: 25,
    [ACHIEVEMENT_RANK.GOLD]: 50,
    [ACHIEVEMENT_RANK.PLATINUM]: 100,
});
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

// A gone Achievement counts nothing; an Unlock later lost keeps its points.
export function getPlayerLevel(notifiedIds, achievements) {
    const notified = new Set(notifiedIds);
    const points = achievements
        .filter(achievement => notified.has(achievement.id))
        .reduce((sum, achievement) => sum + (RANK_POINTS[achievement.rank] || 0), 0);
    return playerLevelOf(points);
}
