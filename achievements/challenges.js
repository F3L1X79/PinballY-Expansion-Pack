// ============================================================
// Challenges family: Achievements for completing 1, 5, 10, 25, 50 and 100
// Challenges. Reads the active Profile's completed count from the
// Challenge module, also shown as Achievement Progress; writes nothing.
// achievements_engine.js leaves the family out when the Challenges Add-on
// is disabled.
// ============================================================

import { ACHIEVEMENT_FAMILY, countedAchievement, PROGRESS_UNIT } from "../common/achievements/achievements.js";
import lang from "../common/core/i18n.js";

// Each value is part of an Achievement ID: changing one would announce the
// Achievement again to players who already earned it. Each one also needs
// its title in every lang/ file.
const CHALLENGE_THRESHOLDS = [1, 5, 10, 25, 50, 100];

export function buildChallengeAchievements(challenges) {
    const { achievements: TEXT } = lang;
    const getCompletedCount = () => challenges.getRecord().completed;

    return CHALLENGE_THRESHOLDS.map(count => countedAchievement({
        id: `challengesCompleted:${count}`,
        family: ACHIEVEMENT_FAMILY.CHALLENGES,
        getTitle: () => TEXT.challengesCompletedTitles[count],
        getDescription: () => TEXT.challengesCompletedDescription(count),
        target: count,
        ladder: CHALLENGE_THRESHOLDS,
        unit: PROGRESS_UNIT.CHALLENGES,
        getCurrent: getCompletedCount,
    }));
}
