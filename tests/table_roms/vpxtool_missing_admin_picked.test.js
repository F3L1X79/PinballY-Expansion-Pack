// ============================================================
// vpxtool missing with Table ROMs on, an Admin Profile picked at startup
// through main.js on the fake host, closed by a hurried player: the Error
// Toast waits for the Startup Screen, arrives right after it, and names the
// tools folder and what is lost; the line is an error in logfile.log and errors.log.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLines } from "../support/error_log.js";
import { VPXTOOL } from "./table_roms_scenario.js";
import { pickAtStartup } from "./vpxtool_missing_scenario.js";

const ERROR_LOG = "C:\\PinballY\\Scripts\\ExpansionPack\\errors.log";
// The toasts' own arrival gap, and a little more.
const MAX_ARRIVAL_MS = 1000;

test("vpxtool missing: an Admin Profile picked at startup sees the Error Toast once the Startup Screen closed", async () => {
    // The last active Profile, highlighted while the toast arrives, does not see the setup entries.
    const { fake, store, drawnBeforeClosing, arrivalMs, errorCards } = await pickAtStartup({
        adminProfiles: ["Alice"], activeProfile: "Bob", moves: ["Prev"],
    });

    assert.equal(store.getActiveProfile().name, "Alice");
    assert.equal(drawnBeforeClosing, false, "the toast waits for the Startup Screen");
    assert.ok(arrivalMs !== null && arrivalMs <= MAX_ARRIVAL_MS, `arrives right after the Welcome Screen closed, not after ${arrivalMs} ms`);
    assert.deepEqual(errorCards.map(card => card.text), [
        "PROBLEM | Table ROMs | vpxtool.exe is missing from the Expansion Pack's tools folder: the tables' ROMs are not filled.",
    ]);
    assert.deepEqual(errorLines(fake), [`[TableRoms] ERROR vpxtool not found at ${VPXTOOL}; the table scripts are not read.`]);
    assert.match(fake.readFile(ERROR_LOG), /\[TableRoms\] ERROR vpxtool not found at /);
});
