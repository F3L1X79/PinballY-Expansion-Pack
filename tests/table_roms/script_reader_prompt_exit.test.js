// ============================================================
// Script Reader Prompt closed with Exit, then a restart (first start in a
// child process), through main.js on the fake host: nothing is saved, and
// the next start asks again.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLines } from "../support/error_log.js";
import { answerThenRestart, PROMPT, MISSING_LOGGED } from "./script_reader_prompt_scenario.js";

test("Exit closes the Script Reader Prompt without an answer, and the next start asks again", async () => {
    const { firstRun, next } = await answerThenRestart("Exit");

    assert.deepEqual(firstRun.dialog, PROMPT);
    assert.equal(firstRun.envLocal, null);
    assert.ok(firstRun.settingsLines.offlineMode.includes("Offer vpxtool: On"));
    assert.deepEqual(next.dialog, PROMPT);
    assert.deepEqual(errorLines(next.fake), [MISSING_LOGGED]);
});
