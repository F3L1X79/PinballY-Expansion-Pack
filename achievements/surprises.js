// ============================================================
// The Surprises family: Secret Achievements that hang on no Add-on but the
// Achievements themselves. Each one is unlocked by what the Surprises
// tracker (common/surprises.js) recorded in the active Profile's
// "surprises" part: a flag, or for Four Seasons every season seen. Night
// Owl is absent for a Child Profile, whatever its flag says. No
// Achievement Progress. Called by achievements_engine.js at
// each check; no side effects.
// ============================================================

import { ACHIEVEMENT_FAMILY, ACHIEVEMENT_RANK, standaloneAchievement } from "../common/achievements.js";
import lang from "../common/i18n.js";
import { getProfileStore } from "../common/profile_store.js";
import {
    NIGHT_OWL_FIRST_HOUR, NIGHT_OWL_LAST_HOUR, LUNCH_BREAK_FIRST_HOUR, LUNCH_BREAK_LAST_HOUR, SEASON_COUNT, surprisesOf,
} from "../common/surprises.js";

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

    achievements.push(
        standaloneAchievement({
            id: "fridayThe13th",
            family: ACHIEVEMENT_FAMILY.SURPRISES,
            rank: ACHIEVEMENT_RANK.PLATINUM,
            getTitle: () => TEXT.fridayThe13thTitle(),
            getDescription: () => TEXT.fridayThe13thDescription(),
            getHint: () => TEXT.fridayThe13thHint(),
            checkUnlocked: () => activeSurprises().fridayThe13th === true,
        }),
        standaloneAchievement({
            id: "fourSeasons",
            family: ACHIEVEMENT_FAMILY.SURPRISES,
            rank: ACHIEVEMENT_RANK.GOLD,
            getTitle: () => TEXT.fourSeasonsTitle(),
            getDescription: () => TEXT.fourSeasonsDescription(SEASON_COUNT),
            getHint: () => TEXT.fourSeasonsHint(),
            checkUnlocked: () => new Set(activeSurprises().seasons || []).size >= SEASON_COUNT,
        }),
        standaloneAchievement({
            id: "lunchBreak",
            family: ACHIEVEMENT_FAMILY.SURPRISES,
            rank: ACHIEVEMENT_RANK.SILVER,
            getTitle: () => TEXT.lunchBreakTitle(),
            getDescription: () => TEXT.lunchBreakDescription(hourStart(LUNCH_BREAK_FIRST_HOUR), hourEnd(LUNCH_BREAK_LAST_HOUR)),
            getHint: () => TEXT.lunchBreakHint(),
            checkUnlocked: () => activeSurprises().lunchBreak === true,
        }),
        standaloneAchievement({
            id: "mirrorHour",
            family: ACHIEVEMENT_FAMILY.SURPRISES,
            rank: ACHIEVEMENT_RANK.SILVER,
            getTitle: () => TEXT.mirrorHourTitle(),
            getDescription: () => TEXT.mirrorHourDescription(),
            getHint: () => TEXT.mirrorHourHint(),
            checkUnlocked: () => activeSurprises().mirrorHour === true,
        }),
    );

    return achievements;
}
