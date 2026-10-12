// ============================================================
// The first Play on a table the pack never read, through main.js on the
// fake PinballY globals: when the launch read fails too, the board after
// the game becomes the table's baseline, all Default Scores, and nothing
// is credited; the next Play credits as usual.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, boardLines, MEDIEVAL } from "./high_scores_scenario.js";

test("the first Play on a never-read table sets its baseline and credits nothing", async () => {
    const { setBoard, play, saved, log } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    setBoard(MEDIEVAL, boardLines(["SLL", "52000000"], [["BRE", "40000000"]]), { fails: true });

    await play(MEDIEVAL, { after: boardLines(["ALI", "60000000"], [["SLL", "52000000"], ["BRE", "40000000"]]) });

    assert.deepEqual(saved(), {
        version: 1,
        tables: {
            [MEDIEVAL]: {
                board: [
                    { rank: 1, initials: "ALI", score: 60000000, owner: null },
                    { rank: 2, initials: "SLL", score: 52000000, owner: null },
                    { rank: 3, initials: "BRE", score: 40000000, owner: null },
                ],
            },
        },
        highScores: [],
    });
    assert.deepEqual(log(), [
        `[HighScores] "${MEDIEVAL}": the high scores read failed (PINemHi could not read the high scores.).`,
        `[HighScores] "${MEDIEVAL}": no board known before the game; the board after it is the baseline, nothing credited.`,
    ]);

    await play(MEDIEVAL, { after: boardLines(["ALI", "60000000"], [["ALI", "55000000"], ["SLL", "52000000"], ["BRE", "40000000"]]) });
    assert.deepEqual(saved().highScores.map(({ profile, place }) => [profile, place]), [["Alice", 2]]);
});
