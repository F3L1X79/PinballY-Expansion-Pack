// ============================================================
// Achievements for the active Profile's CUMULATIVE play time across the
// entire collection (sum of its play seconds on every visible table), one
// per threshold in PLAY_TIME_THRESHOLDS_HOURS, with the hours played as
// Achievement Progress.
// Called by achievements_engine.js at each check; no side effects.
// ============================================================

import { ACHIEVEMENT_FAMILY, countedAchievement, PROGRESS_UNIT } from "../common/achievements/achievements.js";
import lang from "../common/core/i18n.js";
import { createPinballYHost } from "../common/core/pinbally_host.js";
import { getProfileStore } from "../common/profiles/profile_store.js";

// Each value is part of an Achievement ID: changing one would announce the
// Achievement again to players who already earned it. Each one also needs
// its title in every lang/ file.
const PLAY_TIME_THRESHOLDS_HOURS = [1, 5, 10, 50, 100];
const SECONDS_PER_TENTH_OF_AN_HOUR = 360;

export function buildPlayTimeTotalAchievements() {
    const { achievements: TEXT } = lang;

    // Rounded down to a tenth of an hour: it reaches a whole number of hours
    // exactly when the seconds do, so it never shows a target not yet met.
    function getTotalPlayTimeHours() {
        // The household's visible tables, Adult Tables included: like the
        // Profile Stats' total time, a Child Profile keeps what it played.
        const seconds = createPinballYHost().getVisibleTables()
            .reduce((total, game) => total + getProfileStore().getPlay(game.configId).seconds, 0);
        return Math.floor(seconds / SECONDS_PER_TENTH_OF_AN_HOUR) / 10;
    }

    return PLAY_TIME_THRESHOLDS_HOURS.map(hours => countedAchievement({
        id: `playTimeMilestone:${hours}h`,
        family: ACHIEVEMENT_FAMILY.PLAY_TIME,
        getTitle: () => TEXT.playTimeMilestoneTitles[hours],
        getDescription: () => TEXT.playTimeMilestoneDescription(hours),
        target: hours,
        ladder: PLAY_TIME_THRESHOLDS_HOURS,
        unit: PROGRESS_UNIT.HOURS,
        getCurrent: getTotalPlayTimeHours,
    }));
}