// ============================================================
// A ROM reset that brings back fewer than 5 new places, through main.js
// on the fake PinballY globals: the Profile's places vanish from the
// board, beaten by no new place, so the reset credits nothing, its new
// places become Default Scores and it is logged; the next Play credits.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, FACTORY, MEDIEVAL } from "./high_scores_scenario.js";

test("factory scores back after a reset are never credited, even when only 2 places are new", async () => {
    const { setBoard, play, saved, log } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    setBoard(MEDIEVAL, FACTORY);
    await play(MEDIEVAL, { after: board(["ALI", "90000000"], ["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]) });

    await play(MEDIEVAL, { after: FACTORY });

    assert.deepEqual(saved().tables[MEDIEVAL].board.map(({ initials, score, owner }) => [initials, score, owner]), [
        ["SLL", 52000000, null],
        ["BRE", 40000000, null],
        ["LFS", 30000000, null],
        ["ZAP", 20000000, null],
        ["RCF", 10000000, null],
    ]);
    assert.deepEqual(saved().highScores.map(({ score }) => score), [90000000, 60000000]);
    assert.deepEqual(log().slice(-1), [
        `[HighScores] "${MEDIEVAL}": 2 new places after a Play by Alice, but a place gone from the board was beaten by no new place: a ROM reset, nothing credited, the new places are Default Scores.`,
    ]);

    await play(MEDIEVAL, { after: board(["SLL", "52000000"], ["ALI", "45000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    assert.deepEqual(saved().highScores.map(({ profile, place, score }) => [profile, place, score]).slice(-1), [["Alice", 2, 45000000]]);
});
