// ============================================================
// ROM-less High Scores and ROM tables, through main.js on the fake
// PinballY globals: a ROM table whose PINemHi read gives a board is
// settled on it, VPReg.stg never consulted even when a section changed;
// a ROM table whose PINemHi read gives none falls back to the VPReg.stg
// section learned for it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startHighScores, TABLES, MEDIEVAL, AFM, FACTORY, SECOND_PLACE, VPX_SYSTEM, HIGH_SCORES_FILE, OTHER_SECTIONS, vpregBoard,
} from "./high_scores_scenario.js";

test("the PINemHi board wins on a ROM table; without one, its learned section is read", async () => {
    const afmSection = vpregBoard(["AFM", 9000000], ["MAR", 8000000]);
    const { setBoard, setVpreg, play, saved, log } = await startHighScores({
        profiles: { Alice: {} },
        active: "Alice",
        tables: TABLES.map(table => ({ ...table, system: VPX_SYSTEM })),
        files: {
            [HIGH_SCORES_FILE]: JSON.stringify({ version: 1, tables: {}, highScores: [], learnedSources: { [AFM]: { kind: "vpreg", section: "afm" } } }),
        },
    });
    setBoard(MEDIEVAL, FACTORY);
    setVpreg({ ...OTHER_SECTIONS, afm: afmSection });

    // A section changes during the Play on Medieval Madness: not its board.
    await play(MEDIEVAL, { after: SECOND_PLACE, afterVpreg: { ...OTHER_SECTIONS, afm: afmSection, burner: vpregBoard(["ALI", 1700000]) } });
    // Attack from Mars: PINemHi reads nothing, its learned section does.
    await play(AFM, { afterVpreg: { ...OTHER_SECTIONS, afm: vpregBoard(["AFM", 9000000], ["ALI", 8500000], ["MAR", 8000000]) } });

    assert.deepEqual(log().filter(line => !line.includes("the high scores read failed")), [
        `[HighScores] "${MEDIEVAL}": first board read, 5 places, all Default Scores.`,
        `[HighScores] "${MEDIEVAL}": High Score for Alice: place 2, 45000000 (ALI).`,
        `[HighScores] "${AFM}": board read from VPReg.stg section "afm" (VPReg.stg read in 0 ms before the game, 0 ms after).`,
        `[HighScores] "${AFM}": first board read, 2 places, all Default Scores.`,
        `[HighScores] "${AFM}": High Score for Alice: place 2, 8500000 (ALI).`,
    ]);
    assert.deepEqual(saved().learnedSources, { [AFM]: { kind: "vpreg", section: "afm" } }, "nothing learned for Medieval Madness");
});
