// ============================================================
// ROM-less High Scores with a changed text file while VPReg.stg cannot be
// read, through main.js on the fake PinballY globals: a section changed
// alongside could not be seen, so nothing is learned from the file.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, PAPASMURF, PAPASMURF_TABLE, VPREG_PATH, textBoard } from "./high_scores_scenario.js";

test("a changed text file teaches nothing while VPReg.stg cannot be read", async () => {
    const { fake, setUserFiles, play, saved, log } = await startHighScores({ profiles: { Alice: {} }, active: "Alice", tables: [PAPASMURF_TABLE] });
    fake.addFile(VPREG_PATH, "not a compound file");
    setUserFiles({ "papasmurf.txt": textBoard(["0", "6"], ["AAA", 45510], ["ZZZ", 44000], ["XXX", 43000], ["ABC", 42000], ["BBB", 41000]) });

    await play(PAPASMURF, {
        afterUserFiles: { "papasmurf.txt": textBoard(["0", "6"], ["FEF", 50000], ["AAA", 45510], ["ZZZ", 44000], ["XXX", 43000], ["ABC", 42000]) },
    });

    assert.deepEqual(log(), [
        `[HighScores] "${PAPASMURF}": ${VPREG_PATH} could not be read (VPReg.stg is not a compound file.); nothing credited from it.`,
    ]);
    assert.equal(saved(), undefined);
});
