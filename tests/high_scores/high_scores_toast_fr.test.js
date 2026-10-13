// ============================================================
// High Score Toasts in French, through main.js on the fake PinballY
// globals: "meilleur score" with the place's French ordinal, "record"
// for the Table Record, the score's thousands separated by no-break spaces.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, MEDIEVAL } from "./high_scores_scenario.js";

test("the toasts in French: the place's ordinal, then the Table Record", async () => {
    const { setBoard, play, toasts } = await startHighScores({ profiles: { Alice: {} }, active: "Alice", language: "fr" });
    setBoard(MEDIEVAL, board(["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"], ["RCF", "10000000"]));

    await play(MEDIEVAL, { after: board(["SLL", "52000000"], ["AAA", "45000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    await play(MEDIEVAL, { after: board(["SLL", "52000000"], ["AAA", "45000000"], ["BRE", "40000000"], ["BBB", "35000000"], ["LFS", "30000000"]) });
    await play(MEDIEVAL, { after: board(["CCC", "60000000"], ["SLL", "52000000"], ["AAA", "45000000"], ["BRE", "40000000"], ["BBB", "35000000"]) });

    assert.deepEqual(toasts(), [
        "2 | MEILLEUR SCORE | Meilleur score sur Medieval Madness : 2e place | 45 000 000 points",
        "4 | MEILLEUR SCORE | Meilleur score sur Medieval Madness : 4e place | 35 000 000 points",
        "1 | MEILLEUR SCORE | Record sur Medieval Madness ! | 60 000 000 points",
    ]);
});
