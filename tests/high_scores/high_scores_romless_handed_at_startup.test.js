// ============================================================
// ROM-less boards handed to PinballY at startup, through main.js on the
// fake PinballY globals: each table with a learned section or file gets
// its stored board as plain lines (the DMD and the info box show them);
// a ROM table gets nothing, even with a learned section: PINemHi may read
// its ROM now.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startHighScores, TABLES, MEDIEVAL, AFM, ZELDA, ZELDA_TABLE, PAPASMURF, PAPASMURF_TABLE, HIGH_SCORES_FILE,
} from "./high_scores_scenario.js";

const place = (rank, initials, score, owner = null) => ({ rank, initials, score, owner });

test("at startup, each learned table gets its stored board", async () => {
    const { handedBoards } = await startHighScores({
        profiles: { Alice: {} },
        active: "Alice",
        tables: [...TABLES, ZELDA_TABLE, PAPASMURF_TABLE],
        files: {
            [HIGH_SCORES_FILE]: JSON.stringify({
                version: 1,
                tables: {
                    [MEDIEVAL]: { board: [place(1, "SLL", 52000000)] },
                    [AFM]: { board: [place(1, "AFM", 9000000)] },
                    [ZELDA]: { board: [place(1, "FEF", 3000000, "Alice"), place(2, "AAA", 2800000)] },
                    [PAPASMURF]: { board: [place(1, "", 120000)] },
                },
                highScores: [],
                learnedSources: { [AFM]: { kind: "vpreg", section: "afm" }, [ZELDA]: { kind: "vpreg", section: "ZELDA" }, [PAPASMURF]: { kind: "text", file: "papasmurf.txt" } },
            }),
        },
    });

    assert.deepEqual(handedBoards(), [
        { configId: ZELDA, lines: ["1) FEF 3,000,000", "2) AAA 2,800,000"] },
        { configId: PAPASMURF, lines: ["1) 120,000"] },
    ]);
});
