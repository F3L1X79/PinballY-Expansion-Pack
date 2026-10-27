// ============================================================
// vpxtool missing with Table ROMs on, an Admin Profile picked at startup
// through main.js on the fake host: the Error Toast waits for the Startup
// Screen, then names the tools folder and what is lost; the line is an
// error in logfile.log and errors.log.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLines } from "../support/error_log.js";
import { VPXTOOL } from "./table_roms_scenario.js";
import { pickAtStartup } from "./vpxtool_missing_scenario.js";

const ERROR_LOG = "C:\\PinballY\\Scripts\\ExpansionPack\\errors.log";

test("vpxtool missing: an Admin Profile picked at startup sees the Error Toast once the Startup Screen closed", async () => {
    // The last active Profile, highlighted while the toast arrives, does not see the setup entries.
    const { fake, store, errorCardsWhilePicking, errorCards } = await pickAtStartup({
        adminProfiles: ["Alice"], activeProfile: "Bob", moves: ["Prev"],
    });

    assert.equal(store.getActiveProfile().name, "Alice");
    assert.deepEqual(errorCardsWhilePicking, [], "the toast waits for the Startup Screen");
    assert.deepEqual(errorCards.map(card => card.text), [
        "PROBLEM | Table ROMs | vpxtool.exe is missing from the Expansion Pack's tools folder: the tables' ROMs are not filled.",
    ]);
    assert.ok(errorCards[0].shownMs >= 10000, `holds at least 10 s, not ${errorCards[0].shownMs} ms`);
    assert.deepEqual(errorLines(fake), [`[TableRoms] ERROR vpxtool not found at ${VPXTOOL}; the table scripts are not read.`]);
    assert.match(fake.readFile(ERROR_LOG), /\[TableRoms\] ERROR vpxtool not found at /);
});
