// ============================================================
// Achievements for the number of distinct tables the active Profile played:
// a "first table ever" one, then one per percentage of the collection in
// COLLECTION_PERCENT_THRESHOLDS, with tables played as Achievement Progress.
// Called by achievements_engine.js at each check; no side effects.
// - asNonChild builds them as a non-child Profile would see them (Player Level scaling).
// ============================================================

import { ACHIEVEMENT_FAMILY, countedAchievement, PROGRESS_UNIT } from "../common/achievements/achievements.js";
import lang from "../common/core/i18n.js";
import { countPlayedTables, getActiveProfileTables } from "../common/tables/visible_tables.js";
import { getProfileStore } from "../common/profiles/profile_store.js";

// Each value is part of an Achievement ID: changing one would announce the
// Achievement again to players who already earned it. Each one also needs
// its title in every lang/ file.
const COLLECTION_PERCENT_THRESHOLDS = [10, 25, 50, 75, 100];
// The Achievement Rank ladder: the first table ever, then each percentage.
const FIRST_TABLE_STEP = "firstTable";
const COLLECTION_LADDER = [FIRST_TABLE_STEP, ...COLLECTION_PERCENT_THRESHOLDS];

export function buildCollectionCompletionAchievements({ asNonChild = false, profileName } = {}) {
    const { achievements: TEXT } = lang;

    const totalCount = getActiveProfileTables({ asNonChild, profileName }).length;

    function countPlayed() {
        return countPlayedTables(getActiveProfileTables({ asNonChild, profileName }), getProfileStore());
    }

    // A target of 1 shows no Achievement Progress.
    const achievements = [
        countedAchievement({
            id: `collectionMilestone:${FIRST_TABLE_STEP}`,
            family: ACHIEVEMENT_FAMILY.COLLECTION,
            getTitle: () => TEXT.firstTableTitle(),
            getDescription: () => TEXT.firstTableDescription(),
            target: 1,
            ladder: COLLECTION_LADDER,
            step: FIRST_TABLE_STEP,
            unit: PROGRESS_UNIT.TABLES,
            getCurrent: countPlayed,
        }),
    ];

    for (const percent of COLLECTION_PERCENT_THRESHOLDS) {
        const requiredCount = Math.ceil((percent / 100) * totalCount);

        achievements.push(countedAchievement({
            id: `collectionMilestone:${percent}percent`,
            family: ACHIEVEMENT_FAMILY.COLLECTION,
            getTitle: () => TEXT.collectionPercentTitles[percent],
            getDescription: () => TEXT.collectionPercentDescription(percent, requiredCount, totalCount),
            target: requiredCount,
            ladder: COLLECTION_LADDER,
            step: percent,
            unit: PROGRESS_UNIT.TABLES,
            getCurrent: countPlayed,
        }));
    }

    return achievements;
}