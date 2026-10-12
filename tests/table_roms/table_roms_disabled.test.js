// ============================================================
// Table ROMs turned off in config.addOns, through main.js on the fake
// PinballY globals: no script is read and nothing is written; the ROMs it
// wrote before stay in PinballY, and its record file is kept as it was
// for when it is turned back on.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startTableRoms, table, vpxFile, RECORD_FILE } from "./table_roms_scenario.js";

const AFM = "Attack from Mars (Bally 1995)";
const MEDIEVAL = "Medieval Madness (Williams 1997)";
const RECORD = JSON.stringify({
    version: 1,
    tables: { [AFM]: { script: { vpx: { modified: 1, size: 1 }, vbs: null, rom: "afm_113" }, written: { rom: "afm_113", source: "script" } } },
});

test("turned off, the Add-on reads and writes nothing, and keeps its record", async () => {
    const { fake, readScripts, roms, log, scriptsRead } = await startTableRoms({
        tables: [table(AFM, { rom: "afm_113" }), table(MEDIEVAL)],
        files: { [vpxFile(AFM)]: {}, [vpxFile(MEDIEVAL)]: {}, [RECORD_FILE]: { content: RECORD } },
        vpxtool: { [vpxFile(AFM)]: "afm_113", [vpxFile(MEDIEVAL)]: "mm_109c" },
        enabled: false,
    });
    readScripts();

    assert.deepEqual(scriptsRead(), []);
    assert.deepEqual(roms(), { [AFM]: "afm_113", [MEDIEVAL]: "" });
    assert.deepEqual(log(), []);
    assert.equal(fake.readFile(RECORD_FILE), RECORD);
    assert.deepEqual(fake.gameUpdates(), []);
});
