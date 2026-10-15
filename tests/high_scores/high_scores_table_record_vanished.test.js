// ============================================================
// A Play that beats the Table Record, through main.js on the fake
// PinballY globals: the old one vanishes instead of moving down, as on
// many tables, beaten by the new one, so the Play is still credited, a
// second player's lower place too.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, FACTORY, MEDIEVAL } from "./high_scores_scenario.js";

test("a Play is credited when the beaten Table Record vanishes and a second player enters lower", async () => {
    const { setBoard, play, saved } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    setBoard(MEDIEVAL, FACTORY);

    await play(MEDIEVAL, { after: board(["ALI", "60000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["BOB", "25000000"], ["ZAP", "20000000"]) });

    assert.deepEqual(saved().highScores.map(({ profile, place, score }) => [profile, place, score]), [
        ["Alice", 1, 60000000], ["Alice", 4, 25000000],
    ]);
});
