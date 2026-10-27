// ============================================================
// vpxtool missing with Table ROMs turned off, an Admin Profile picked at
// startup through main.js on the fake host: no Error Toast and no error.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { pickAtStartup } from "./vpxtool_missing_scenario.js";

test("vpxtool missing with Table ROMs off: no Error Toast and no error", async () => {
    const { fake, errorCards } = await pickAtStartup({ adminProfiles: ["Alice"], activeProfile: "Alice", tableRoms: false });

    assert.deepEqual(errorCards, []);
    assertNoErrorLogged(fake);
});
