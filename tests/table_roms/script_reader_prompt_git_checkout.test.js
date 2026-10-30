// ============================================================
// Script Reader Prompt with vpxtool missing in a pack installed with git,
// the Update Check off, through main.js on the fake host: offered all the
// same, as git pull never brings vpxtool.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLines } from "../support/error_log.js";
import { startForScriptReader, PROMPT, MISSING_LOGGED } from "./script_reader_prompt_scenario.js";

test("vpxtool missing in a git checkout with the Update Check off: the Script Reader Prompt still opens", async () => {
    const start = await startForScriptReader({
        settings: { updateCheck: false },
        seed: f => f.addFolder("C:\\PinballY\\Scripts\\ExpansionPack\\.git"),
    });

    assert.deepEqual(start.dialog, PROMPT);
    assert.deepEqual(start.fake.httpRequests(), []);
    assert.deepEqual(errorLines(start.fake), [MISSING_LOGGED]);
});
