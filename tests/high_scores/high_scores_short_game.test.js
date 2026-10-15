// ============================================================
// A game under a minute, through main.js on the fake PinballY globals:
// it credits nothing, but its board after the game becomes the last known
// board, its new places Default Scores, which a later Play never credits.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, boardLines, MEDIEVAL } from "./high_scores_scenario.js";

test("a game under a minute credits nothing, and its new places stay Default Scores", async () => {
    const { setBoard, play, saved, log } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    setBoard(MEDIEVAL, boardLines(["SLL", "52000000"], [["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]]));

    await play(MEDIEVAL, { durationMs: 40 * 1000, after: boardLines(["SLL", "52000000"], [["ALI", "45000000"], ["BRE", "40000000"], ["LFS", "30000000"]]) });
    await play(MEDIEVAL, { after: boardLines(["SLL", "52000000"], [["ALI", "45000000"], ["BRE", "40000000"], ["ALI", "35000000"]]) });

    assert.deepEqual(saved().tables[MEDIEVAL].board.map(({ initials, score, owner }) => [initials, score, owner]), [
        ["SLL", 52000000, null],
        ["ALI", 45000000, null],
        ["BRE", 40000000, null],
        ["ALI", 35000000, "Alice"],
    ]);
    assert.deepEqual(saved().highScores.map(({ score }) => score), [35000000]);
    assert.deepEqual(log(), [
        `[HighScores] "${MEDIEVAL}": first board read, 4 places, all Default Scores.`,
        `[HighScores] "${MEDIEVAL}": 1 new place after a game under a minute, as Default Scores.`,
        `[HighScores] "${MEDIEVAL}": High Score for Alice: place 4, 35000000 (ALI).`,
    ]);
});
