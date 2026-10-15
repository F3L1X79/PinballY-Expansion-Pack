// ============================================================
// ROM-less High Scores, a Play that changes two board sections, through
// main.js on the fake PinballY globals: no telling which one is the
// table's, so nothing is learned or credited, in one log line; a later
// Play that changes only one learns it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, ZELDA, ZELDA_TABLE, ZELDA_FACTORY, OTHER_SECTIONS, vpregBoard } from "./high_scores_scenario.js";

test("two board sections changed teach nothing; a later Play changing one learns it", async () => {
    const { setVpreg, play, saved, log, toasts } = await startHighScores({ profiles: { Alice: {} }, active: "Alice", tables: [ZELDA_TABLE] });
    const burnerChanged = { ...OTHER_SECTIONS, burner: vpregBoard(["XYZ", 1600000], ["AAA", 1500000]) };
    const zeldaAfter = vpregBoard(["FEF", 2900000], ["AAA", 2800000], ["BBB", 2700000], ["CCC", 2600000]);
    setVpreg({ ...OTHER_SECTIONS, ZELDA: ZELDA_FACTORY });

    await play(ZELDA, { afterVpreg: { ...burnerChanged, ZELDA: zeldaAfter } });

    assert.deepEqual(log(), [
        `[HighScores] "${ZELDA}": no board after the game, and 2 boards changed (burner, ZELDA); nothing learned, nothing credited.`,
    ]);
    assert.equal(saved(), undefined, "nothing learned, no board recorded");
    assert.deepEqual(toasts().filter(text => text.includes("HIGH SCORE")), []);

    await play(ZELDA, { afterVpreg: { ...burnerChanged, ZELDA: vpregBoard(["FEF", 3000000], ["FEF", 2900000], ["AAA", 2800000], ["BBB", 2700000]) } });

    assert.deepEqual(saved().learnedSources, { [ZELDA]: { kind: "vpreg", section: "ZELDA" } });
    assert.deepEqual(saved().highScores.map(({ place, score, tableRecord }) => ({ place, score, tableRecord })), [{ place: 1, score: 3000000, tableRecord: true }]);
    assert.deepEqual(saved().tables[ZELDA].board.map(place => place.owner), ["Alice", null, null, null]);
});
