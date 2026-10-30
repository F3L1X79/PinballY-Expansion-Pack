// ============================================================
// Script Reader Prompt answered "No thanks", then a restart (first start in
// a child process), through main.js on the fake host: OFFER_VPXTOOL=false is
// saved, the Offline Mode line reads Off at once while the install line
// stays, and the next start asks nothing.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLines } from "../support/error_log.js";
import { answerThenRestart, PROMPT, MISSING_LOGGED } from "./script_reader_prompt_scenario.js";

test("No thanks saves OFFER_VPXTOOL=false, and the next start asks nothing", async () => {
    const { firstRun, next } = await answerThenRestart("No thanks");

    assert.deepEqual(firstRun.dialog, PROMPT);
    assert.equal(firstRun.envLocal, "OFFER_VPXTOOL=false\r\n");
    assert.ok(firstRun.settingsLines.list.includes("Install vpxtool v0.38.0"), "the install line stays");
    assert.ok(firstRun.settingsLines.offlineMode.includes("Offer vpxtool: Off"), "Off, with no restart to ask");
    assert.equal(next.dialog, null);
    assert.deepEqual(errorLines(next.fake), [MISSING_LOGGED]);
});
