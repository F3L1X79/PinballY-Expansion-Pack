// ============================================================
// Table ROMs without vpxtool in the pack's tools folder, through main.js on
// the fake PinballY globals: one error line is logged, no script is read, no ROM
// field changes and no record is written; the Add-on stays loaded.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startTableRoms, table, vpxFile, VPXTOOL, RECORD_FILE } from "./table_roms_scenario.js";

const AFM = "Attack from Mars (Bally 1995)";
const MEDIEVAL = "Medieval Madness (Williams 1997)";

test("without vpxtool, one error line is logged and nothing is read or written", async () => {
    const { fake, readScripts, roms, log, scriptsRead } = await startTableRoms({
        tables: [table(AFM), table(MEDIEVAL)],
        files: { [vpxFile(AFM)]: {}, [vpxFile(MEDIEVAL)]: {} },
    });
    readScripts();

    assert.deepEqual(log(), [`[TableRoms] ERROR vpxtool not found at ${VPXTOOL}; the table scripts are not read.`]);
    assert.deepEqual(scriptsRead(), []);
    assert.deepEqual(roms(), { [AFM]: "", [MEDIEVAL]: "" });
    assert.equal(fake.readFile(RECORD_FILE), undefined);
    assert.ok(fake.logLines().some(line => /^\[Startup\] "tableRoms" initialized/.test(line)), "the Add-on stays loaded");
});
