// ============================================================
// ROM-less boards with the High Scores Add-on turned off, through main.js
// on the fake PinballY globals: a learned table's stored board is never
// handed to PinballY, at startup or after a Play.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, ZELDA, ZELDA_TABLE, ZELDA_FACTORY, HIGH_SCORES_FILE, vpregBoard } from "./high_scores_scenario.js";

test("with the Add-on off, no board is handed to PinballY", async () => {
    const { setVpreg, play, handedBoards } = await startHighScores({
        addOns: [],
        profiles: { Alice: {} },
        active: "Alice",
        tables: [ZELDA_TABLE],
        files: {
            [HIGH_SCORES_FILE]: JSON.stringify({
                version: 1,
                tables: { [ZELDA]: { board: [{ rank: 1, initials: "AAA", score: 2800000, owner: null }] } },
                highScores: [],
                learnedSources: { [ZELDA]: { kind: "vpreg", section: "ZELDA" } },
            }),
        },
    });
    setVpreg({ ZELDA: ZELDA_FACTORY });

    await play(ZELDA, { afterVpreg: { ZELDA: vpregBoard(["FEF", 3000000], ["AAA", 2800000]) } });

    assert.deepEqual(handedBoards(), []);
});
