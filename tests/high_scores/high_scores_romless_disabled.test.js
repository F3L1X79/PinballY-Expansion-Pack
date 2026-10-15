// ============================================================
// ROM-less High Scores with the High Scores Add-on turned off, through
// main.js on the fake PinballY globals: a Play on an original table
// reads no VPReg.stg and learns nothing.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, ZELDA, ZELDA_TABLE, ZELDA_FACTORY, VPREG_PATH, vpregBoard } from "./high_scores_scenario.js";

test("with the Add-on off, VPReg.stg is never read", async () => {
    const { fake, setVpreg, play, saved } = await startHighScores({ addOns: [], profiles: { Alice: {} }, active: "Alice", tables: [ZELDA_TABLE] });
    setVpreg({ ZELDA: ZELDA_FACTORY });

    await play(ZELDA, { afterVpreg: { ZELDA: vpregBoard(["FEF", 3000000], ["AAA", 2800000]) } });

    assert.deepEqual(fake.fileReads().filter(path => path === VPREG_PATH), []);
    assert.equal(saved(), undefined);
});
