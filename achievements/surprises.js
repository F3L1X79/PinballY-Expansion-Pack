// ============================================================
// The Surprises family: Secret Achievements that hang on no Add-on but the
// Achievements themselves. Night Owl is unlocked by the active Profile's
// surprises.nightOwl flag, set by the Surprises tracker
// (common/surprises.js), and is absent for a Child Profile, whatever that
// flag says. No Achievement Progress. Called by achievements_engine.js at
// each check; no side effects.
// ============================================================

import { ACHIEVEMENT_FAMILY, ACHIEVEMENT_RANK, standaloneAchievement } from "../common/achievements.js";
import lang from "../common/i18n.js";
import { getProfileStore } from "../common/profile_store.js";
import { NIGHT_OWL_FIRST_HOUR, NIGHT_OWL_LAST_HOUR, surprisesOf } from "../common/surprises.js";

// "03:00" for 3.
const hourStart = hour => `${String(hour).padStart(2, "0")}:00`;
// "03:59" for 3.
const hourEnd = hour => `${String(hour).padStart(2, "0")}:59`;

export function buildSurprisesAchievements() {
    const { achievements: TEXT } = lang;
    const profileStore = getProfileStore();
    const activeSurprises = () => surprisesOf(profileStore.getProfileData());
    const achievements = [];

    // Never pushes a child to play at night.
    if (!profileStore.isChild()) {
        achievements.push(standaloneAchievement({
            id: "nightOwl",
            family: ACHIEVEMENT_FAMILY.SURPRISES,
            rank: ACHIEVEMENT_RANK.GOLD,
            getTitle: () => TEXT.nightOwlTitle(),
            getDescription: () => TEXT.nightOwlDescription(hourStart(NIGHT_OWL_FIRST_HOUR), hourEnd(NIGHT_OWL_LAST_HOUR)),
            getHint: () => TEXT.nightOwlHint(),
            checkUnlocked: () => activeSurprises().nightOwl === true,
        }));
    }

    return achievements;
}
