// ============================================================
// Script Reader Prompt with vpxtool missing, a last active Profile that is
// not an Admin Profile while the Household has one, through main.js on the
// fake host: no prompt, no Error Toast; the Profile picker opens as usual.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLines } from "../support/error_log.js";
import { startForScriptReader, pickHurriedly, ENV_LOCAL, MISSING_LOGGED } from "./script_reader_prompt_scenario.js";

test("vpxtool missing: a last active Profile without the setup entries gets no Script Reader Prompt", async () => {
    const start = await startForScriptReader({ adminProfiles: ["Alice"], activeProfile: "Bob" });
    const { fake } = start;

    assert.equal(start.dialog, null);
    const { carouselOpen, errorCards } = await pickHurriedly(start);
    assert.equal(carouselOpen, true);
    assert.deepEqual(errorCards, [], "no Error Toast either");
    assert.equal(fake.readFile(ENV_LOCAL), undefined, "nothing answered");
    assert.deepEqual(errorLines(fake), [MISSING_LOGGED]);
});
