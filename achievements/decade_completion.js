// ============================================================
// One Achievement per release decade (from game.year): unlocked once the
// active Profile has played every table it can see from that decade.
// Called by achievements_engine.js at each check; no side effects.
// - Tables without a year are ignored.
// - asNonChild builds them as a non-child Profile would see them (Player Level scaling).
// ============================================================

import { buildGroupedCompletionAchievements } from "../common/achievements/grouped_completion.js";
import { ACHIEVEMENT_FAMILY } from "../common/achievements/achievements.js";
import lang from "../common/core/i18n.js";
import { getDecadeStartYear } from "../common/achievements/decade.js";

export function buildDecadeCompletionAchievements({ asNonChild = false, profileName } = {}) {
    const { achievements: TEXT } = lang;
    return buildGroupedCompletionAchievements({
        getGroupKeys: (game) => {
            const decadeStartYear = getDecadeStartYear(game.year);
            return decadeStartYear === null ? [] : [`${decadeStartYear}s`];
        },
        asNonChild,
        profileName,
        idPrefix: "decadeCompletion",
        family: ACHIEVEMENT_FAMILY.DECADES,
        // The "1980s" group key stays in the achievement ID for backward compatibility;
        // the language files receive the bare start year and format it themselves.
        getTitle: (decade) => TEXT.decadeCompletionTitle(parseInt(decade, 10)),
        getDescription: (decade, count) => TEXT.decadeCompletionDescription(parseInt(decade, 10), count),
    });
}