// ============================================================
// A ROM reset back to factory scores, through main.js on the fake PinballY
// globals: more than 4 new places after a Play (more than a 4-player game
// can make) credit nothing, become Default Scores on the last known board
// and are logged as a reset; the next Play credits as usual.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, boardLines, MEDIEVAL } from "./high_scores_scenario.js";

const PLAYED = boardLines(["ALI", "90000000"], [["ALI", "80000000"], ["BOB", "70000000"], ["CAT", "65000000"], ["DAN", "60000000"]]);
const FACTORY = boardLines(["SLL", "52000000"], [["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"], ["RCF", "10000000"]]);

test("a board wiped back to factory scores credits nothing and becomes the last known board", async () => {
    const { setBoard, play, saved, log } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    setBoard(MEDIEVAL, PLAYED);

    await play(MEDIEVAL, { after: FACTORY });

    assert.deepEqual(saved().tables[MEDIEVAL].board.map(({ initials, score, owner }) => [initials, score, owner]), [
        ["SLL", 52000000, null],
        ["BRE", 40000000, null],
        ["LFS", 30000000, null],
        ["ZAP", 20000000, null],
        ["RCF", 10000000, null],
    ]);
    assert.deepEqual(saved().highScores, []);
    assert.deepEqual(log(), [
        `[HighScores] "${MEDIEVAL}": first board read, 5 places, all Default Scores.`,
        `[HighScores] "${MEDIEVAL}": 5 new places after a Play by Alice, more than a 4-player game can make: a ROM reset, nothing credited, the new places are Default Scores.`,
    ]);

    await play(MEDIEVAL, { after: boardLines(["SLL", "52000000"], [["ALI", "45000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]]) });
    assert.deepEqual(saved().highScores.map(({ profile, place, score }) => [profile, place, score]), [["Alice", 2, 45000000]]);
});
