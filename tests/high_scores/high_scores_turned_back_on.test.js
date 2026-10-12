// ============================================================
// The High Scores Add-on turned back on, through main.js on the fake
// PinballY globals: the boards and High Scores it already knew are kept,
// and the next Play is compared with them.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, boardLines, MEDIEVAL, HIGH_SCORES_FILE } from "./high_scores_scenario.js";

const EARLIER_HIGH_SCORE = {
    profile: "Bob", configId: MEDIEVAL, score: 60000000, initials: "BOB", place: 1,
    date: "2026-09-01T20:00:00", tableRecord: true, takenFrom: null,
};

test("turned back on, the known boards and High Scores are kept", async () => {
    const { setBoard, play, saved } = await startHighScores({
        profiles: { Alice: {}, Bob: {} }, active: "Alice",
        files: {
            [HIGH_SCORES_FILE]: JSON.stringify({
                version: 1,
                tables: {
                    [MEDIEVAL]: {
                        board: [
                            { rank: 1, initials: "BOB", score: 60000000, owner: "Bob" },
                            { rank: 2, initials: "SLL", score: 52000000, owner: null },
                        ],
                    },
                },
                highScores: [EARLIER_HIGH_SCORE],
            }),
        },
    });
    setBoard(MEDIEVAL, boardLines(["BOB", "60000000"], [["SLL", "52000000"]]));

    await play(MEDIEVAL, { after: boardLines(["ALI", "70000000"], [["BOB", "60000000"], ["SLL", "52000000"]]) });

    assert.deepEqual(saved().highScores, [
        EARLIER_HIGH_SCORE,
        { profile: "Alice", configId: MEDIEVAL, score: 70000000, initials: "ALI", place: 1, date: "2026-10-12T20:00:00", tableRecord: true, takenFrom: "Bob" },
    ]);
});
