// ============================================================
// Builds one achievement per release decade (from game.year): unlocked once
// the active Profile has played every table it can see released in that decade
// at least once.
// Sorted chronologically; tables without a year are ignored. asNonChild builds them as a Profile that is not
// a child would see them (for the Player Level's scaling).
// Called by achievements_engine.js at each check; no side effects.
// ============================================================

import { buildGroupedCompletionAchievements } from "../common/grouped_completion.js";
import { ACHIEVEMENT_FAMILY } from "../common/achievements.js";
import lang from "../common/i18n.js";
import { getDecadeStartYear } from "../common/decade.js";

export function buildDecadeCompletionAchievements({ asNonChild = false } = {}) {
    const { achievements: TEXT } = lang;
    return buildGroupedCompletionAchievements({
        getGroupKeys: (game) => {
            const decadeStartYear = getDecadeStartYear(game.year);
            return decadeStartYear === null ? [] : [`${decadeStartYear}s`];
        },
        asNonChild,
        idPrefix: "decadeCompletion",
        family: ACHIEVEMENT_FAMILY.DECADES,
        // The "1980s" group key stays in the achievement ID for backward compatibility;
        // the language files receive the bare start year and format it themselves.
        getTitle: (decade) => TEXT.decadeCompletionTitle(parseInt(decade, 10)),
        getDescription: (decade, count) => TEXT.decadeCompletionDescription(parseInt(decade, 10), count),
    });
}