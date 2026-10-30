// ============================================================
// Script Reader Prompt with vpxtool missing in a Household without any
// Admin Profile, through main.js on the fake host: whoever was last active
// gets it, as everyone sees the setup entries; Install / No thanks.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLines } from "../support/error_log.js";
import { startForScriptReader, PROMPT, MISSING_LOGGED } from "./script_reader_prompt_scenario.js";

test("vpxtool missing: without an Admin Profile, the last active Profile gets the Script Reader Prompt", async () => {
    const start = await startForScriptReader({ activeProfile: "Bob" });

    assert.deepEqual(start.dialog, PROMPT);
    assert.deepEqual(errorLines(start.fake), [MISSING_LOGGED]);
});
