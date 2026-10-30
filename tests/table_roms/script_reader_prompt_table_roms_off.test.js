// ============================================================
// Script Reader Prompt with vpxtool missing and Table ROMs turned off, an
// Admin Profile last active, through main.js on the fake host: no prompt,
// no Error Toast and no error.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startForScriptReader, pickHurriedly } from "./script_reader_prompt_scenario.js";

test("vpxtool missing with Table ROMs off: no Script Reader Prompt and no error", async () => {
    const start = await startForScriptReader({ adminProfiles: ["Alice"], activeProfile: "Alice", tableRoms: false });

    assert.equal(start.dialog, null);
    const { carouselOpen, errorCards } = await pickHurriedly(start);
    assert.equal(carouselOpen, true);
    assert.deepEqual(errorCards, []);
    assertNoErrorLogged(start.fake);
});
