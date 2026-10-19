// ============================================================
// ROM-less boards handed to PinballY after a Play: a learned board is handed
// as plain lines once the Play is settled, changed or not; a ROM table whose
// board PinballY reads itself never gets one.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startHighScores, TABLES, MEDIEVAL, AFM, HIGH_SCORES_FILE, FACTORY, SECOND_PLACE, ZELDA, ZELDA_TABLE, ZELDA_FACTORY, OTHER_SECTIONS, VPX_SYSTEM, vpregBoard,
} from "./high_scores_scenario.js";

test("after each Play on a learned table, PinballY gets its board, a ROM table read by PINemHi never", async () => {
    const { setBoard, setVpreg, play, handedBoards } = await startHighScores({
        profiles: { Alice: {} },
        active: "Alice",
        tables: [...TABLES.map(table => ({ ...table, system: VPX_SYSTEM })), ZELDA_TABLE],
        files: {
            [HIGH_SCORES_FILE]: JSON.stringify({ version: 1, tables: {}, highScores: [], learnedSources: { [AFM]: { kind: "vpreg", section: "afm" } } }),
        },
    });
    setBoard(MEDIEVAL, FACTORY);
    const afm = vpregBoard(["AFM", 9000000], ["MAR", 8000000]);
    setVpreg({ ...OTHER_SECTIONS, afm, ZELDA: ZELDA_FACTORY });

    const zeldaAfter = vpregBoard(["ALI", 3000000], ["ALI", 2900000], ["AAA", 2800000], ["BBB", 2700000]);

    await play(MEDIEVAL, { after: SECOND_PLACE });
    await play(ZELDA, { afterVpreg: { ...OTHER_SECTIONS, afm, ZELDA: vpregBoard(["ALI", 3000000], ["AAA", 2800000], ["BBB", 2700000], ["CCC", 2600000]) } });
    await play(ZELDA, { afterVpreg: { ...OTHER_SECTIONS, afm, ZELDA: zeldaAfter } });
    // The board did not change.
    await play(ZELDA, { afterVpreg: { ...OTHER_SECTIONS, afm, ZELDA: zeldaAfter } });
    // PINemHi reads nothing for Attack from Mars: its learned section does.
    await play(AFM, { afterVpreg: { ...OTHER_SECTIONS, afm: vpregBoard(["AFM", 9000000], ["ALI", 8500000], ["MAR", 8000000]), ZELDA: zeldaAfter } });

    assert.deepEqual(handedBoards(), [
        { configId: ZELDA, lines: ["1) ALI 3,000,000", "2) AAA 2,800,000", "3) BBB 2,700,000", "4) CCC 2,600,000"] },
        { configId: ZELDA, lines: ["1) ALI 3,000,000", "2) ALI 2,900,000", "3) AAA 2,800,000", "4) BBB 2,700,000"] },
        { configId: ZELDA, lines: ["1) ALI 3,000,000", "2) ALI 2,900,000", "3) AAA 2,800,000", "4) BBB 2,700,000"] },
        { configId: AFM, lines: ["1) AFM 9,000,000", "2) ALI 8,500,000", "3) MAR 8,000,000"] },
    ]);
});
