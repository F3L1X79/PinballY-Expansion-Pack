// ============================================================
// One achievement per manufacturer found in the collection (including
// the fictional "VPX Community" manufacturer, treated like any other):
// unlocked once the active Profile has played every table it can see from
// that manufacturer at least once, with the tables played of that
// manufacturer as Achievement Progress and an Achievement Rank from the
// number of its tables. Sorted by manufacturer. asNonChild builds them as
// a Profile that is not a child would see them (for the Player Level's
// scaling). Called by achievements_engine.js; no side effects.
// ============================================================

import { ACHIEVEMENT_FAMILY, countedAchievement, PROGRESS_UNIT } from "../common/achievements.js";
import lang from "../common/i18n.js";
import { getActiveProfileTables } from "../common/visible_tables.js";
import { getProfileStore } from "../common/profile_store.js";

export function buildManufacturerCompletionAchievements({ asNonChild = false } = {}) {
    const { achievements: TEXT } = lang;

    const allGames = getActiveProfileTables({ asNonChild });

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