// ============================================================
// Where Table ROMs looks for the .nv files, through main.js on the fake
// PinballY globals: as PinballY does, in the table's system NVRAM path
// when set, otherwise in VPinMAME's nvram_directory from the registry,
// the local machine's when the current user has none.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startTableRoms, table, vpxFile } from "./table_roms_scenario.js";

const AFM = "Attack from Mars (Bally 1995)";
const MEDIEVAL = "Medieval Madness (Williams 1997)";
const SYSTEM_FOLDER = "D:\\Pinball\\nvram";
const MACHINE_FOLDER = "C:\\VPinMAME\\nvram";

test("the system's NVRAM path comes first, then the local machine's registry", async () => {
    const { fake, play, roms } = await startTableRoms({
        tables: [table(AFM, { system: { nvramPath: SYSTEM_FOLDER } }), table(MEDIEVAL, { system: { nvramPath: "" } })],
        files: { [vpxFile(AFM)]: {}, [vpxFile(MEDIEVAL)]: {} },
        nvramFolder: null,
    });
    fake.setRegistryValue("HKLM\\Software\\Freeware\\Visual PinMame\\globals\\nvram_directory", MACHINE_FOLDER);
    fake.addFolder(SYSTEM_FOLDER);
    fake.addFolder(MACHINE_FOLDER);

    await play(AFM, { nvWritten: ["afm_113"], folder: SYSTEM_FOLDER });
    await play(MEDIEVAL, { nvWritten: ["mm_109c"], folder: MACHINE_FOLDER });

    assert.deepEqual(roms(), { [AFM]: "afm_113", [MEDIEVAL]: "mm_109c" });
});
