// ============================================================
// The Table Record Achievements, through main.js on the fake PinballY
// globals: Table Records on 1 and 3 tables, and The Usurper for a Table
// Record taken from another Profile, Guest included, never from a Default
// Score nor from the Profile itself. Achievements stay earned when the
// Profile's scores are pushed off the board.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, FACTORY, highScoreIds, romTables } from "./high_scores_scenario.js";

const [T1, T2, T3] = romTables(3).map(table => table.configId);

test("Table Records on 1 and 3 tables, The Usurper only for a record taken from another Profile, kept once pushed off", async () => {
    const { setBoard, play, switchTo, showEveryToast, notified, readShown } = await startHighScores({
        addOns: ["highScores", "achievements", "customMenuCommands"], profiles: { Alice: {}, Bob: {} }, active: "Alice", tables: romTables(3),
    });
    setBoard(T1, FACTORY);
    setBoard(T2, FACTORY);
    // A board of two places, which two new ones push a place off.
    setBoard(T3, board(["SLL", "52000000"], ["BRE", "40000000"]));

    // From a Default Score, then from herself.
    await play(T1, { after: board(["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    await play(T1, { after: board(["ALI", "70000000"], ["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]) });
    await showEveryToast();
    assert.deepEqual(highScoreIds(notified("Alice")), ["highScoreTables:1", "tableRecordTables:1"]);

    // From Guest.
    switchTo("guest");
    await play(T2, { after: board(["GST", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    await showEveryToast();
    switchTo("Alice");
    await play(T2, { after: board(["ALI", "65000000"], ["GST", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]) });
    await showEveryToast();
    assert.ok(notified("Alice").includes("tableRecordTaken"), "taken from Guest");

    await play(T3, { after: board(["ALI", "60000000"], ["SLL", "52000000"]) });
    await showEveryToast();
    assert.deepEqual(highScoreIds(notified("Alice")).sort(), [
        "highScoreTables:1", "highScoreTables:3", "tableRecordTables:1", "tableRecordTables:3", "tableRecordTaken",
    ]);

    // Bob pushes Alice off the third table's board.
    switchTo("Bob");
    await play(T3, { after: board(["BOB", "80000000"], ["BOB", "75000000"]) });
    await showEveryToast();
    assert.deepEqual(highScoreIds(notified("Bob")), ["highScoreTables:1", "tableRecordTables:1", "tableRecordTaken"]);

    switchTo("Alice");
    assert.deepEqual(readShown(["Three Banners Raised", "One Score to Rule Them All", "Warlord of Three Worlds", "The Usurper"])
        .map(row => row.unlocked), [true, true, true, true]);
});
