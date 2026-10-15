// ============================================================
// ROM-less High Scores, a table that keeps a single high score (a lone
// HighScore value, as La Schtroumpfette's section), through main.js on
// the fake PinballY globals: beating it is credited as the Table Record.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, VPX_SYSTEM, OTHER_SECTIONS } from "./high_scores_scenario.js";

const SMURFETTE = "La Schtroumpfette (Original 2021)";
const SMURFETTE_TABLE = { id: 4, configId: SMURFETTE, title: "La Schtroumpfette", manufacturer: "Original", year: 2021, isHidden: false, system: VPX_SYSTEM };

test("beating a one-place board is the Table Record", async () => {
    const { setVpreg, play, saved, toasts, showEveryToast } = await startHighScores({ profiles: { Alice: {} }, active: "Alice", tables: [SMURFETTE_TABLE] });
    setVpreg({ ...OTHER_SECTIONS, smurfette: { HighScore: "10000", Credits: "0" } });

    await play(SMURFETTE, { afterVpreg: { ...OTHER_SECTIONS, smurfette: { HighScore: "25000", Credits: "0" } } });
    await showEveryToast();

    assert.deepEqual(saved().learnedSources, { [SMURFETTE]: { kind: "vpreg", section: "smurfette" } });
    assert.deepEqual(saved().tables[SMURFETTE].board, [{ rank: 1, initials: "", score: 25000, owner: "Alice" }]);
    assert.deepEqual(saved().highScores.map(({ profile, place, score, tableRecord }) => ({ profile, place, score, tableRecord })), [
        { profile: "Alice", place: 1, score: 25000, tableRecord: true },
    ]);
    assert.deepEqual(toasts().filter(text => text.includes("HIGH SCORE")), ["1 | HIGH SCORE | Table Record on La Schtroumpfette! | 25,000 points"]);
});
