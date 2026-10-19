// ============================================================
// One Achievement per manufacturer in the collection: unlocked once the
// active Profile has played every table it can see from it, with an
// Achievement Rank from the manufacturer's table count.
// Called by achievements_engine.js at each check; no side effects.
// - "VPX Community" is treated like any other manufacturer.
// - asNonChild builds them as a non-child Profile would see them (Player Level scaling).
// ============================================================

import { ACHIEVEMENT_FAMILY, countedAchievement, PROGRESS_UNIT } from "../common/achievements/achievements.js";
import lang from "../common/core/i18n.js";
import { getActiveProfileTables } from "../common/tables/visible_tables.js";
import { getProfileStore } from "../common/profiles/profile_store.js";

export function buildManufacturerCompletionAchievements({ asNonChild = false, profileName } = {}) {
    const { achievements: TEXT } = lang;

    const allGames = getActiveProfileTables({ asNonChild, profileName });

    const manufacturers = new Set();
    for (const game of allGames) {
        if (game.manufacturer) manufacturers.add(game.manufacturer);
    }

    const achievements = [];
    for (const manufacturer of [...manufacturers].sort((a, b) => a.localeCompare(b))) {
        const gamesForManufacturer = allGames.filter(game => game.manufacturer === manufacturer);

        achievements.push(countedAchievement({
            id: `manufacturerCompletion:${manufacturer}`,
            family: ACHIEVEMENT_FAMILY.MANUFACTURERS,
            getTitle: () => TEXT.manufacturerCompletionTitle(manufacturer),
            getDescription: () => TEXT.manufacturerCompletionDescription(manufacturer, gamesForManufacturer.length),
            target: gamesForManufacturer.length,
            isGroupCompletion: true,
            unit: PROGRESS_UNIT.TABLES,
            getCurrent: () => gamesForManufacturer.filter(game => getProfileStore().hasPlayed(game.configId)).length,
        }));
    }

    return achievements;
}