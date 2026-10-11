// ============================================================
// Manufacturers family: Achievements for tables of 3, 5, 8 and 10 different
// manufacturers played on the same calendar day. Reads the active Profile's
// one-day record, kept by session_stats_tracker.js, also shown as
// Achievement Progress; writes nothing.
// ============================================================

import { ACHIEVEMENT_FAMILY, countedAchievement, PROGRESS_UNIT } from "../common/achievements/achievements.js";
import lang from "../common/core/i18n.js";
import { getProfileStore } from "../common/profiles/profile_store.js";

// Each value is part of an Achievement ID: changing one would announce the
// Achievement again to players who already earned it. Each one also needs
// its title in every lang/ file.
const DAY_MANUFACTURERS_THRESHOLDS = [3, 5, 8, 10];

export function buildDayManufacturersAchievements() {
    const { achievements: TEXT } = lang;

    return DAY_MANUFACTURERS_THRESHOLDS.map(count => countedAchievement({
        id: `dayManufacturers:${count}`,
        family: ACHIEVEMENT_FAMILY.MANUFACTURERS,
        getTitle: () => TEXT.dayManufacturersTitles[count],
        getDescription: () => TEXT.dayManufacturersDescription(count),
        target: count,
        ladder: DAY_MANUFACTURERS_THRESHOLDS,
        unit: PROGRESS_UNIT.MANUFACTURERS,
        getCurrent: () => getProfileStore().getProfileData().sessions.mostManufacturersInADay,
    }));
}
