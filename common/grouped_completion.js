// ============================================================
// Generic "the active Profile played every table in this group at least
// once" achievement builder, used by the category and decade achievements,
// with the tables played of the group as Achievement Progress and an
// Achievement Rank from the size of the group. A game can belong
// to multiple groups (e.g. multiple categories), in which case it counts
// toward each of them. Groups are made of the tables the active Profile can
// see, so a group with none of them gives no Achievement. The Achievements
// come sorted by group key. asNonChild builds them as a Profile that is
// not a child would see them. No side effects.
// ============================================================

import { getActiveProfileTables } from "./visible_tables.js";
import { getProfileStore } from "./profile_store.js";
import { countedAchievement, PROGRESS_UNIT } from "./achievements.js";

export function buildGroupedCompletionAchievements({ getGroupKeys, idPrefix, family, getTitle, getDescription, asNonChild = false }) {
    const allGames = getActiveProfileTables({ asNonChild });
    const groups = new Map();

    for (const game of allGames) {
        for (const key of getGroupKeys(game)) {
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(game);
        }
    }

    // Decade keys ("1980s") sort chronologically as text too.
    const sortedKeys = [...groups.keys()].sort((a, b) => a.localeCompare(b));

    const achievements = [];
    for (const key of sortedKeys) {
        const games = groups.get(key);
        achievements.push(countedAchievement({
            id: `${idPrefix}:${key}`,
            family,
            getTitle: () => getTitle(key),
            getDescription: () => getDescription(key, games.length),
            target: games.length,
            isGroupCompletion: true,
            unit: PROGRESS_UNIT.TABLES,
            getCurrent: () => games.filter(game => getProfileStore().hasPlayed(game.configId)).length,
        }));
    }
    return achievements;
}