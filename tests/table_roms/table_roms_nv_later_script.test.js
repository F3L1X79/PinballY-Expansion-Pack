// ============================================================
// Table ROMs after a restart, through main.js on the fake PinballY
// globals: a ROM an earlier session confirmed by a .nv is never replaced
// by the script read that follows, nor reported as a disagreement.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startTableRoms, table, vpxFile, RECORD_FILE } from "./table_roms_scenario.js";

const AFM = "Attack from Mars (Bally 1995)";
const MODIFIED = new Date(2026, 5, 1, 12, 0, 0).getTime();

test("a later script read never replaces a ROM a .nv confirmed", async () => {
    const { readScripts, roms, log, record } = await startTableRoms({
        tables: [table(AFM, { rom: "afm_113b" })],
        files: {
            [vpxFile(AFM)]: { content: "script", modified: MODIFIED },
            [RECORD_FILE]: { content: JSON.stringify({ version: 1, tables: { [AFM]: { written: { rom: "afm_113b", source: "nv" } } } }) },
        },
        vpxtool: { [vpxFile(AFM)]: "afm_113" },
    });

    readScripts();

    assert.deepEqual(roms(), { [AFM]: "afm_113b" });
    assert.deepEqual(log(), []);
    assert.deepEqual(record().tables[AFM], {
        script: { vpx: { modified: MODIFIED, size: "script".length }, vbs: null, rom: "afm_113" },
        written: { rom: "afm_113b", source: "nv" },
    });
});
