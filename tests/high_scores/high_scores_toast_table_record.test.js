// ============================================================
// High Score Toasts, through main.js on the fake PinballY globals: when
// the best place a Play won is the first, the toast tells the Table Record.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, FACTORY, MEDIEVAL } from "./high_scores_scenario.js";

test("a new first place brings the Table Record text instead", async () => {
    const { setBoard, play, toasts } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    setBoard(MEDIEVAL, FACTORY);

    await play(MEDIEVAL, { after: board(["AAA", "60000000"], ["SLL", "52000000"], ["BBB", "45000000"], ["BRE", "40000000"], ["LFS", "30000000"]) });

    assert.deepEqual(toasts(), ["1 | HIGH SCORE | Table Record on Medieval Madness! | 60,000,000 points"]);
});
