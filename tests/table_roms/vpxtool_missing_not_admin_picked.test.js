// ============================================================
// vpxtool missing with Table ROMs on, a Profile that is not an Admin
// Profile picked at startup while the Household has one, through main.js
// on the fake host: no Error Toast that start, the error still logged.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLines } from "../support/error_log.js";
import { VPXTOOL } from "./table_roms_scenario.js";
import { pickAtStartup } from "./vpxtool_missing_scenario.js";

test("vpxtool missing: a Profile without the setup entries picked at startup sees no Error Toast", async () => {
    // The last active Profile, highlighted while the toast arrives, sees the setup entries.
    const { fake, store, drawnBeforeClosing, arrivalMs, errorCards } = await pickAtStartup({
        adminProfiles: ["Alice"], activeProfile: "Alice", moves: ["Next"],
    });

    assert.equal(store.getActiveProfile().name, "Bob");
    assert.equal(drawnBeforeClosing, false);
    assert.equal(arrivalMs, null);
    assert.deepEqual(errorCards, [], "no Error Toast for Bob");
    assert.deepEqual(errorLines(fake), [`[TableRoms] ERROR vpxtool not found at ${VPXTOOL}; the table scripts are not read.`]);
});
