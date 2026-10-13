// ============================================================
// High Score Toasts, through main.js on the fake PinballY globals: a Play
// that wins places on a table's board brings one toast, for the best place
// won, naming the table, the place and the score.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, FACTORY, MEDIEVAL } from "./high_scores_scenario.js";

test("a Play that wins places brings one toast, for the best place won", async () => {
    const { setBoard, play, toasts } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    setBoard(MEDIEVAL, FACTORY);

    // A two-player game: 3rd and 5th place.
    await play(MEDIEVAL, { after: board(["SLL", "52000000"], ["BRE", "40000000"], ["AAA", "35000000"], ["LFS", "30000000"], ["BBB", "25000000"]) });

    assert.deepEqual(toasts(), ["3 | HIGH SCORE | High score on Medieval Madness: 3rd place | 35,000,000 points"]);
});
