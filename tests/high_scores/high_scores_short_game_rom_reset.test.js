// ============================================================
// A ROM reset seen after a game under a minute, through main.js on the
// fake PinballY globals: a place gone that no new place beat is logged as
// a reset, its new places Default Scores, nothing credited.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, FACTORY, MEDIEVAL } from "./high_scores_scenario.js";

test("a game under a minute with a place gone unbeaten is logged as a ROM reset", async () => {
    const { setBoard, play, saved, log } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    setBoard(MEDIEVAL, board(["ALI", "90000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]));

    await play(MEDIEVAL, { durationMs: 40 * 1000, after: FACTORY });

    assert.deepEqual(saved().tables[MEDIEVAL].board.map(({ initials, owner }) => [initials, owner]), [
        ["SLL", null], ["BRE", null], ["LFS", null], ["ZAP", null], ["RCF", null],
    ]);
    assert.deepEqual(saved().highScores, []);
    assert.deepEqual(log().slice(-1), [
        `[HighScores] "${MEDIEVAL}": 1 new place after a game under a minute, but a place gone from the board was beaten by no new place: a ROM reset, nothing credited, the new places are Default Scores.`,
    ]);
});
