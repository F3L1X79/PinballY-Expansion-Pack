// ============================================================
// A 4-player game, through main.js on the fake PinballY globals: exactly
// 4 new places after a Play are all credited, not taken for a ROM reset.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, boardLines, MEDIEVAL } from "./high_scores_scenario.js";

const FACTORY = boardLines(["SLL", "52000000"], [["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"], ["RCF", "10000000"]]);

test("4 new places after a Play, a 4-player game, are all credited", async () => {
    const { setBoard, play, saved } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    setBoard(MEDIEVAL, FACTORY);

    await play(MEDIEVAL, { after: boardLines(["ALI", "90000000"], [["BOB", "80000000"], ["CAT", "70000000"], ["DAN", "65000000"], ["SLL", "52000000"]]) });

    assert.deepEqual(saved().highScores.map(({ profile, initials, place }) => [profile, initials, place]), [
        ["Alice", "ALI", 1],
        ["Alice", "BOB", 2],
        ["Alice", "CAT", 3],
        ["Alice", "DAN", 4],
    ]);
});
