// ============================================================
// High Score Toasts, through main.js on the fake PinballY globals: none
// for a Play that wins nothing, a game under a minute, a baseline, a
// failed read after the game or a ROM reset.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, FACTORY, MEDIEVAL, AFM } from "./high_scores_scenario.js";

test("no toast for a Play that wins nothing, a game under a minute, a baseline, a failed read or a ROM reset", async () => {
    const { setBoard, play, toasts } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    setBoard(MEDIEVAL, FACTORY);
    await play(MEDIEVAL, { after: FACTORY });
    await play(MEDIEVAL, { after: board(["SLL", "52000000"], ["AAA", "45000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]), durationMs: 30 * 1000 });
    // Attack from Mars was never read: its launch read fails, so the board after the game is its baseline.
    setBoard(AFM, FACTORY, { fails: true });
    await play(AFM, { after: board(["AAA", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    await play(MEDIEVAL, { after: board(["AAA", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]), afterRead: { fails: true } });
    // Five new places, more than a 4-player game can make.
    await play(MEDIEVAL, { after: board(["A", "5000000"], ["B", "4000000"], ["C", "3000000"], ["D", "2000000"], ["E", "1000000"]) });

    assert.deepEqual(toasts(), []);
});
