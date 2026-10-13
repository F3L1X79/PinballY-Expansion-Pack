// ============================================================
// The Household Stats' Table Records held line, through main.js on the
// fake PinballY globals with the High Scores Add-on on: after the
// completed Challenges, each Profile's tables whose first place on the
// last known board is its own, the most in gold; a place whose Profile no
// longer exists counts for nobody.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold, errorLines, PROFILES, MEDIEVAL, MARS, THEATRE, TWILIGHT } from "./household_stats_scenario.js";
import { readOwnSection } from "./profile_stats_reader.js";
import { openHouseholdStats, labels, lineValues, goldOn } from "./household_stats_reader.js";

const place = (rank, owner) => ({ rank, initials: "AAA", score: 1000000 * (10 - rank), owner });
const HIGH_SCORES = JSON.stringify({
    version: 1,
    highScores: [],
    tables: {
        [MEDIEVAL.configId]: { board: [place(1, "Alice"), place(2, "Bob")] },
        [MARS.configId]: { board: [place(1, "alice"), place(2, null)] },
        [THEATRE.configId]: { board: [place(1, "Bob"), place(2, "Alice")] },
        // Zed is no Profile: the Table Record is nobody's, Carol's place still hers.
        [TWILIGHT.configId]: { board: [place(1, "Zed"), place(2, "Carol")] },
    },
});

test("Table Records held after completed Challenges, the most in gold", async () => {
    const { fake, lang } = await startHousehold({
        profiles: { Alice: {}, Bob: {}, Carol: {} }, active: "Alice",
        addOns: ["achievements", "challenges", "highScores"], files: { [`${PROFILES}\\high_scores.json`]: HIGH_SCORES },
    });
    const TEXT = lang.profileStats;
    const progression = readOwnSection(fake, lang, TEXT.sections.progression);
    assert.deepEqual([progression[TEXT.stats.highScoresHeld], progression[TEXT.stats.tableRecordsHeld]], [["3"], ["2"]]);

    openHouseholdStats(fake, lang);
    assert.deepEqual(labels(fake).slice(-2), [TEXT.stats.challengesCompleted, TEXT.stats.tableRecordsHeld]);
    assert.deepEqual(lineValues(fake, TEXT.stats.tableRecordsHeld), ["2", "1", "0"]);
    assert.deepEqual(goldOn(fake, TEXT.stats.tableRecordsHeld), ["Alice"]);
    assert.deepEqual(errorLines(fake), []);
});
