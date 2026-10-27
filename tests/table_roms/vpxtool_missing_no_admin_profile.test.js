// ============================================================
// vpxtool missing with Table ROMs on, in a Household without any Admin
// Profile, through main.js on the fake host: whoever is picked at startup
// sees the Error Toast, as everyone sees the setup entries.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLines } from "../support/error_log.js";
import { VPXTOOL } from "./table_roms_scenario.js";
import { pickAtStartup } from "./vpxtool_missing_scenario.js";

test("vpxtool missing: without an Admin Profile, the Profile picked at startup sees the Error Toast", async () => {
    const { fake, store, errorCards } = await pickAtStartup({ activeProfile: "Bob" });

    assert.equal(store.getActiveProfile().name, "Bob");
    assert.deepEqual(errorCards.map(card => card.text), [
        "PROBLEM | Table ROMs | vpxtool.exe is missing from the Expansion Pack's tools folder: the tables' ROMs are not filled.",
    ]);
    assert.deepEqual(errorLines(fake), [`[TableRoms] ERROR vpxtool not found at ${VPXTOOL}; the table scripts are not read.`]);
});
