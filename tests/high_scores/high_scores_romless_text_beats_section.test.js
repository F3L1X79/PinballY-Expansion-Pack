// ============================================================
// ROM-less High Scores on La Schtroumpfette, through main.js on the fake
// PinballY globals: a Play that changes both smurfette.txt (five places)
// and the smurfette section of VPReg.stg (a lone HighScore) learns the
// file, the board with more places.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, SMURFETTE, SMURFETTE_TABLE, OTHER_SECTIONS, textBoard } from "./high_scores_scenario.js";

test("a changed text file beats a changed lone HighScore section", async () => {
    const { setVpreg, setUserFiles, play, saved } = await startHighScores({ profiles: { Alice: {} }, active: "Alice", tables: [SMURFETTE_TABLE] });
    setVpreg({ ...OTHER_SECTIONS, smurfette: { HighScore: "10000", Credits: "0" } });
    setUserFiles({ "smurfette.txt": textBoard(["0", "0"], ["AAA", 145510], ["ZZZ", 144000], ["XXX", 143000], ["ABC", 142000], ["BBB", 141000]) });

    await play(SMURFETTE, {
        afterVpreg: { ...OTHER_SECTIONS, smurfette: { HighScore: "150000", Credits: "0" } },
        afterUserFiles: { "smurfette.txt": textBoard(["0", "0"], ["FEF", 150000], ["AAA", 145510], ["ZZZ", 144000], ["XXX", 143000], ["ABC", 142000]) },
    });

    assert.deepEqual(saved().learnedSources, { [SMURFETTE]: { kind: "text", file: "smurfette.txt" } });
    assert.deepEqual(saved().tables[SMURFETTE].board.map(place => [place.initials, place.score, place.owner]), [
        ["FEF", 150000, "Alice"], ["AAA", 145510, null], ["ZZZ", 144000, null], ["XXX", 143000, null], ["ABC", 142000, null],
    ]);
});
