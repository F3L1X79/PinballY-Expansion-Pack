// ============================================================
// ROM-less High Scores from a "5 scores + 5 initials" text file, through
// main.js on the fake PinballY globals: a Play on Le Grand Schtroumpf,
// which keeps its board only in papasmurf.txt, learns that file and
// credits the new place; a later Play reads the learned file from both
// snapshots.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startHighScores, PAPASMURF, PAPASMURF_TABLE, OTHER_SECTIONS, textBoard,
} from "./high_scores_scenario.js";

const SETTINGS = ["0", "6"];
const FACTORY = textBoard(SETTINGS, ["AAA", 45510], ["ZZZ", 44000], ["XXX", 43000], ["ABC", 42000], ["BBB", 41000]);

test("a Play that changes papasmurf.txt learns it and credits the new place; a later Play reads it again", async () => {
    const { setVpreg, setUserFiles, play, saved, log } = await startHighScores({ profiles: { Alice: {} }, active: "Alice", tables: [PAPASMURF_TABLE] });
    setVpreg(OTHER_SECTIONS);
    setUserFiles({ "papasmurf.txt": FACTORY, "CongoLUT.txt": "3\n" });

    await play(PAPASMURF, {
        afterUserFiles: {
            "papasmurf.txt": textBoard(SETTINGS, ["AAA", 45510], ["FEF", 44500], ["ZZZ", 44000], ["XXX", 43000], ["ABC", 42000]),
            "CongoLUT.txt": "4\n",
        },
    });

    assert.deepEqual(saved().learnedSources, { [PAPASMURF]: { kind: "text", file: "papasmurf.txt" } });
    assert.deepEqual(saved().tables[PAPASMURF].board.map(place => [place.initials, place.score, place.owner]), [
        ["AAA", 45510, null], ["FEF", 44500, "Alice"], ["ZZZ", 44000, null], ["XXX", 43000, null], ["ABC", 42000, null],
    ]);

    await play(PAPASMURF, {
        afterUserFiles: { "papasmurf.txt": textBoard(SETTINGS, ["FEF", 50000], ["AAA", 45510], ["FEF", 44500], ["ZZZ", 44000], ["XXX", 43000]) },
    });

    assert.deepEqual(saved().highScores.map(({ place, score, tableRecord }) => ({ place, score, tableRecord })), [
        { place: 2, score: 44500, tableRecord: false },
        { place: 1, score: 50000, tableRecord: true },
    ]);
    assert.deepEqual(log(), [
        `[HighScores] "${PAPASMURF}": text file "papasmurf.txt" learned (User folder read in 0 ms before the game, 0 ms after).`,
        `[HighScores] "${PAPASMURF}": first board read, 5 places, all Default Scores.`,
        `[HighScores] "${PAPASMURF}": High Score for Alice: place 2, 44500 (FEF).`,
        `[HighScores] "${PAPASMURF}": board read from text file "papasmurf.txt" (User folder read in 0 ms before the game, 0 ms after).`,
        `[HighScores] "${PAPASMURF}": High Score for Alice: place 1, 50000 (FEF), Table Record.`,
    ]);
});
