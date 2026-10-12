// ============================================================
// A High Score pushed off the board by later scores, through main.js on
// the fake PinballY globals: it leaves the last known board but stays in
// the High Scores won.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, boardLines, MEDIEVAL } from "./high_scores_scenario.js";

test("a High Score stays recorded when later scores push it off the board", async () => {
    const { setBoard, play, switchTo, saved } = await startHighScores({ profiles: { Alice: {}, Bob: {} }, active: "Alice" });
    setBoard(MEDIEVAL, boardLines(["SLL", "52000000"], [["BRE", "40000000"], ["LFS", "30000000"]]));

    await play(MEDIEVAL, { after: boardLines(["SLL", "52000000"], [["BRE", "40000000"], ["ALI", "35000000"]]) });
    switchTo("Bob");
    await play(MEDIEVAL, { after: boardLines(["SLL", "52000000"], [["BOB", "48000000"], ["BOB", "45000000"], ["BRE", "40000000"]]) });

    assert.deepEqual(saved().tables[MEDIEVAL].board.map(({ initials, owner }) => [initials, owner]), [
        ["SLL", null], ["BOB", "Bob"], ["BOB", "Bob"], ["BRE", null],
    ]);
    assert.deepEqual(saved().highScores.map(({ profile, score }) => [profile, score]), [
        ["Alice", 35000000], ["Bob", 48000000], ["Bob", 45000000],
    ]);
});
