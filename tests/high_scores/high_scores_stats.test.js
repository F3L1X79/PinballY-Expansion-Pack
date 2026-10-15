// ============================================================
// The High Scores lines of the Profile Stats and the Household Stats,
// through main.js on the fake PinballY globals: High Scores held and
// Table Records held, counted in tables still on the last known boards,
// the same on a Profile's own screen and its read-only one; a Profile
// pushed off a board stops counting that table while its High Score stays
// in the file; a Profile Reset changes nothing; the Household's Table
// Records held line, the most in gold.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, FACTORY, romTables } from "./high_scores_scenario.js";
import { readOwnSection, section, PROFILE_STATS_OPEN_MS } from "../stats/profile_stats_reader.js";
import { openHouseholdStats, chooseColumn, backToWheel, labels, lineValues, goldOn } from "../stats/household_stats_reader.js";

const [T1, T2, T3] = romTables(3).map(table => table.configId);

test("High Scores and Table Records held, counted in tables still on the boards, on every screen", async () => {
    const { fake, setBoard, play, switchTo, showEveryToast, resetProfile, saved } = await startHighScores({
        addOns: ["highScores", "achievements", "customMenuCommands"], profiles: { Alice: {}, Bob: {} }, active: "Alice", tables: romTables(3),
    });
    const { default: lang } = await import("../../common/core/i18n.js");
    const TEXT = lang.profileStats;
    const heldIn = progression => [progression[TEXT.stats.highScoresHeld], progression[TEXT.stats.tableRecordsHeld]];
    const ownLines = () => heldIn(readOwnSection(fake, lang, TEXT.sections.progression));
    setBoard(T1, FACTORY);
    setBoard(T2, FACTORY);
    setBoard(T3, board(["SLL", "52000000"], ["BRE", "40000000"]));

    // The Table Record and a third place on one table count it once.
    await play(T1, { after: board(["ALI", "60000000"], ["SLL", "52000000"], ["ALI", "45000000"], ["BRE", "40000000"], ["LFS", "30000000"]) });
    await play(T2, { after: board(["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    await play(T3, { after: board(["SLL", "52000000"], ["ALI", "45000000"]) });
    await showEveryToast();
    assert.deepEqual(ownLines(), [["3"], ["2"]]);

    // Bob pushes Alice off the third table's board.
    switchTo("Bob");
    await play(T3, { after: board(["BOB", "80000000"], ["BOB", "75000000"]) });
    await showEveryToast();
    assert.deepEqual(ownLines(), [["1"], ["1"]]);
    assert.ok(saved().highScores.some(highScore => highScore.profile === "Alice" && highScore.configId === T3), "her High Score stays in the file");

    resetProfile("Alice");
    openHouseholdStats(fake, lang);
    assert.deepEqual(labels(fake).slice(-1), [TEXT.stats.tableRecordsHeld]);
    assert.deepEqual(lineValues(fake, TEXT.stats.tableRecordsHeld), ["1", "2"], "Bob's column first, then Alice's");
    assert.deepEqual(goldOn(fake, TEXT.stats.tableRecordsHeld), ["Alice"]);
    chooseColumn(fake, "Alice");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    const readOnly = heldIn(section(fake, TEXT.sections.progression, TEXT.stats));
    backToWheel(fake);

    switchTo("Alice");
    await showEveryToast();
    assert.deepEqual(ownLines(), [["2"], ["2"]], "a Profile Reset changes nothing");
    assert.deepEqual(readOnly, [["2"], ["2"]], "her read-only screen agrees");
});
