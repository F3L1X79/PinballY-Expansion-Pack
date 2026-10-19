// ============================================================
// The Young Players family: Achievements only a Child Profile has, standing
// in for those it never gets, unlocked from what the Surprises tracker
// (common/achievements/surprises.js) recorded in the Profile's "surprises"
// part, and from the High Score store for Beat the Grown-Ups. Called by
// achievements_engine.js; no side effects.
// - Empty for a non-child Profile and with asNonChild: the set scaling a child's Player Level leaves it out.
// - Beat the Grown-Ups is left out while the High Scores Add-on is off.
// ============================================================

import { ACHIEVEMENT_FAMILY, ACHIEVEMENT_RANK, standaloneAchievement } from "../common/achievements/achievements.js";
import lang from "../common/core/i18n.js";
import { getProfileStore } from "../common/profiles/profile_store.js";
import { surprisesOf } from "../common/achievements/surprises.js";

// highScores: the High Score store, or null while the High Scores Add-on is off.
export function buildYoungPlayersAchievements({ asNonChild = false, profileName, highScores = null } = {}) {
    const profileStore = getProfileStore();
    if (asNonChild || !profileStore.isChild(profileName)) return [];
    const { achievements: TEXT } = lang;
    const activeSurprises = () => surprisesOf(profileStore.getProfileData());
    const highScoreCounts = () => highScores.achievementCountsOf(profileName ?? profileStore.getActiveProfile().name);
    return [
        standaloneAchievement({
            id: "snackTime",
            family: ACHIEVEMENT_FAMILY.YOUNG_PLAYERS,
            rank: ACHIEVEMENT_RANK.BRONZE,
            getTitle: () => TEXT.snackTimeTitle(),
            getDescription: () => TEXT.snackTimeDescription(),
            getHint: () => TEXT.snackTimeHint(),
            checkUnlocked: () => activeSurprises().snackTime === true,
        }),
        standaloneAchievement({
            id: "wednesdayOff",
            family: ACHIEVEMENT_FAMILY.YOUNG_PLAYERS,
            rank: ACHIEVEMENT_RANK.BRONZE,
            getTitle: () => TEXT.wednesdayOffTitle(),
            getDescription: () => TEXT.wednesdayOffDescription(),
            getHint: () => TEXT.wednesdayOffHint(),
            checkUnlocked: () => activeSurprises().wednesdayOff === true,
        }),
        ...(highScores ? [standaloneAchievement({
            id: "grownUpRecordTaken",
            family: ACHIEVEMENT_FAMILY.YOUNG_PLAYERS,
            rank: ACHIEVEMENT_RANK.GOLD,
            getTitle: () => TEXT.grownUpRecordTakenTitle(),
            getDescription: () => TEXT.grownUpRecordTakenDescription(),
            checkUnlocked: () => highScoreCounts().tookGrownUpTableRecord,
        })] : []),
    ];
}
