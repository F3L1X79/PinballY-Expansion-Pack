// ============================================================
// ROM-less High Scores with a text file gone between the User folder's
// listing and its read, through main.js on the fake PinballY globals:
// one log line, that file left out of the snapshot, the Play still
// settled from the table's own file.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, PAPASMURF, PAPASMURF_TABLE, OTHER_SECTIONS, textBoard, userFileOf } from "./high_scores_scenario.js";

test("a text file vanishing before its read is logged and left out", async () => {
    const { fake, setVpreg, setUserFiles, play, saved, log } = await startHighScores({ profiles: { Alice: {} }, active: "Alice", tables: [PAPASMURF_TABLE] });
    setVpreg(OTHER_SECTIONS);
    setUserFiles({ "papasmurf.txt": textBoard(["0", "6"], ["AAA", 45510], ["ZZZ", 44000], ["XXX", 43000], ["ABC", 42000], ["BBB", 41000]), "TMNTLUT.txt": "2\n" });
    fake.vanishBeforeRead(userFileOf("TMNTLUT.txt"));

    await play(PAPASMURF, {
        afterUserFiles: { "papasmurf.txt": textBoard(["0", "6"], ["FEF", 50000], ["AAA", 45510], ["ZZZ", 44000], ["XXX", 43000], ["ABC", 42000]) },
    });

    assert.deepEqual(log().slice(0, 2), [
        `[HighScores] "${PAPASMURF}": ${userFileOf("TMNTLUT.txt")} could not be read (File not found: ${userFileOf("TMNTLUT.txt")}); left out of the snapshot.`,
        `[HighScores] "${PAPASMURF}": text file "papasmurf.txt" learned (User folder read in 0 ms before the game, 0 ms after).`,
    ]);
    assert.deepEqual(saved().highScores.map(({ place, score }) => ({ place, score })), [{ place: 1, score: 50000 }]);
});
