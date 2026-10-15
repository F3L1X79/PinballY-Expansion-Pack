// ============================================================
// High Score Toasts in French, through main.js on the fake PinballY
// globals: a Table Record taken from another Profile says "pris à",
// Guest under its French name.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, MEDIEVAL } from "./high_scores_scenario.js";

test("the Table Record toast says in French whom it was taken from", async () => {
    const { setBoard, play, switchTo, toasts } = await startHighScores({ profiles: { Alice: {} }, active: "guest", language: "fr" });
    setBoard(MEDIEVAL, board(["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"], ["RCF", "10000000"]));

    await play(MEDIEVAL, { after: board(["GST", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    switchTo("Alice");
    await play(MEDIEVAL, { after: board(["AAA", "70000000"], ["GST", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]) });

    assert.deepEqual(toasts(), [
        "1 | MEILLEUR SCORE | Record sur Medieval Madness ! | 60 000 000 points",
        "1 | MEILLEUR SCORE | Record sur Medieval Madness ! | 70 000 000 points | pris à Invité",
    ]);
});
