// ============================================================
// High Scores family: Achievements for High Scores on 1, 3, 5 and 10
// tables, Table Records on 1 and 3 tables, and a Table Record taken from
// another Profile. Reads, from the High Score store, what the Profile won
// since its last Profile Reset, counted in tables (also shown as
// Achievement Progress); writes nothing. achievements_engine.js leaves the
// family out when the High Scores Add-on is disabled.
// ============================================================

import { ACHIEVEMENT_FAMILY, countedAchievement, standaloneAchievement, PROGRESS_UNIT } from "../common/achievements/achievements.js";
import { getProfileStore } from "../common/profiles/profile_store.js";
import lang from "../common/core/i18n.js";

// Each value is part of an Achievement ID: changing one would announce the
// Achievement again to players who already earned it. Each one also needs
// its title in every lang/ file.
const HIGH_SCORE_TABLE_THRESHOLDS = [1, 3, 5, 10];
const TABLE_RECORD_TABLE_THRESHOLDS = [1, 3];

// profileName: the Profile it is seen by, the active one by default.
export function buildHighScoreAchievements(highScores, { profileName } = {}) {
    const { achievements: TEXT } = lang;
    const countsOf = () => highScores.achievementCountsOf(profileName ?? getProfileStore().getActiveProfile().name);

    // A ladder counted in tables: name is its IDs' prefix, its texts'
    // keys' and the count it reads.
    const tableLadder = (name, thresholds) => thresholds.map(count => countedAchievement({
        id: `${name}:${count}`,
        family: ACHIEVEMENT_FAMILY.HIGH_SCORES,
        getTitle: () => TEXT[`${name}Titles`][count],
        getDescription: () => TEXT[`${name}Description`](count),
        target: count,
        ladder: thresholds,
        unit: PROGRESS_UNIT.TABLES,
        getCurrent: () => countsOf()[name],
    }));

    return [
        ...tableLadder("highScoreTables", HIGH_SCORE_TABLE_THRESHOLDS),
        ...tableLadder("tableRecordTables", TABLE_RECORD_TABLE_THRESHOLDS),
        standaloneAchievement({
            id: "tableRecordTaken",
            family: ACHIEVEMENT_FAMILY.HIGH_SCORES,
            getTitle: () => TEXT.tableRecordTakenTitle,
            getDescription: () => TEXT.tableRecordTakenDescription,
            checkUnlocked: () => countsOf().tookTableRecord,
        }),
    ];
}
