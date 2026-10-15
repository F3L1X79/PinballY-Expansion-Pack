// ============================================================
// ROM-less High Scores, a Play that changes the table's section and a
// settings section, through main.js on the fake PinballY globals: the
// settings section holds no board, so the board section is learned.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, ZELDA, ZELDA_TABLE, ZELDA_FACTORY, OTHER_SECTIONS, vpregBoard } from "./high_scores_scenario.js";

test("a settings section changed alongside the table's section is ignored", async () => {
    const { setVpreg, play, saved } = await startHighScores({ profiles: { Alice: {} }, active: "Alice", tables: [ZELDA_TABLE] });
    setVpreg({ ...OTHER_SECTIONS, ZELDA: ZELDA_FACTORY });

    await play(ZELDA, {
        afterVpreg: {
            ...OTHER_SECTIONS,
            ww_lh6: { LUT: "4" },
            ZELDA: vpregBoard(["FEF", 2900000], ["AAA", 2800000], ["BBB", 2700000], ["CCC", 2600000]),
        },
    });

    assert.deepEqual(saved().learnedSources, { [ZELDA]: { kind: "vpreg", section: "ZELDA" } });
    assert.deepEqual(saved().highScores.map(({ profile, place, score }) => ({ profile, place, score })), [{ profile: "Alice", place: 1, score: 2900000 }]);
});
