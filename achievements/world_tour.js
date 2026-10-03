// ============================================================
// The World Tour Achievement: every table of the "All Tables" wheel
// selected in one go, without launching any. Unlocked by the active
// Profile's worldTour flag, set by the World Tour tracker
// (common/world_tour.js); a missing flag reads as false. No Achievement
// Progress. A Secret Achievement: the Achievement List shows its hint
// while it is missing. Called by achievements_engine.js at each check; no
// side effects.
// ============================================================

import { ACHIEVEMENT_FAMILY, ACHIEVEMENT_RANK, standaloneAchievement } from "../common/achievements.js";
import lang from "../common/i18n.js";
import { getProfileStore } from "../common/profile_store.js";

export function buildWorldTourAchievements() {
    const { achievements: TEXT } = lang;

    return [standaloneAchievement({
        id: "worldTour",
        family: ACHIEVEMENT_FAMILY.COLLECTION,
        // Long and tedious, but no skill needed.
        rank: ACHIEVEMENT_RANK.SILVER,
        getTitle: () => TEXT.worldTourTitle(),
        getDescription: () => TEXT.worldTourDescription(),
        getHint: () => TEXT.worldTourHint(),
        checkUnlocked: () => getProfileStore().getProfileData().worldTour === true,
    })];
}
