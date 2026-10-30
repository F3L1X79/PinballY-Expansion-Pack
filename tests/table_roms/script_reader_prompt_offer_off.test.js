// ============================================================
// Script Reader Prompt with vpxtool missing and "Offer vpxtool" off, an
// Admin Profile last active, through main.js on the fake host: no prompt and
// no Error Toast; the missing vpxtool is still logged.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLines } from "../support/error_log.js";
import { startForScriptReader, pickHurriedly, MISSING_LOGGED } from "./script_reader_prompt_scenario.js";

test("vpxtool missing with Offer vpxtool off: no Script Reader Prompt", async () => {
    const start = await startForScriptReader({ adminProfiles: ["Alice"], activeProfile: "Alice", settings: { offerVpxtool: false } });

    assert.equal(start.dialog, null);
    const { carouselOpen, errorCards } = await pickHurriedly(start);
    assert.equal(carouselOpen, true);
    assert.deepEqual(errorCards, []);
    assert.deepEqual(errorLines(start.fake), [MISSING_LOGGED]);
});
