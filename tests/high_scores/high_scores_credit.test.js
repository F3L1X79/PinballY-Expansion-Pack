// ============================================================
// High Scores credited after a Play, through main.js on the fake PinballY
// globals: the board read at launch is the one the Play is compared with,
// the board read again after the game tells the new places, each credited
// to the Profile active when the Play started, whatever the initials, and
// kept in high_scores.json next to cabinet.json; every board change and
// every High Score is logged.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, boardLines, MEDIEVAL } from "./high_scores_scenario.js";

const FACTORY = boardLines(["SLL", "52.000.000"], [["BRE", "40.000.000"], ["LFS", "30.000.000"], ["ZAP", "20.000.000"], ["RCF", "10.000.000"]]);

test("a new place after a Play is a High Score of the Profile active when it started, whatever the initials", async () => {
    const { setBoard, play, saved, log } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    setBoard(MEDIEVAL, FACTORY);

    await play(MEDIEVAL, {
        after: boardLines(["SLL", "52.000.000"], [["BRE", "40.000.000"], ["BOB", "35.000.000"], ["LFS", "30.000.000"], ["ZAP", "20.000.000"]]),
    });

    assert.deepEqual(saved(), {
        version: 1,
        tables: {
            [MEDIEVAL]: {
                board: [
                    { rank: 1, initials: "SLL", score: 52000000, owner: null },
                    { rank: 2, initials: "BRE", score: 40000000, owner: null },
                    { rank: 3, initials: "BOB", score: 35000000, owner: "Alice" },
                    { rank: 4, initials: "LFS", score: 30000000, owner: null },
                    { rank: 5, initials: "ZAP", score: 20000000, owner: null },
                ],
            },
        },
        highScores: [
            { profile: "Alice", configId: MEDIEVAL, score: 35000000, initials: "BOB", place: 3, date: "2026-10-12T20:00:00", tableRecord: false, takenFrom: null },
        ],
    });
    assert.deepEqual(log(), [
        `[HighScores] "${MEDIEVAL}": first board read, 5 places, all Default Scores.`,
        `[HighScores] "${MEDIEVAL}": High Score for Alice: place 3, 35000000 (BOB).`,
    ]);
});
