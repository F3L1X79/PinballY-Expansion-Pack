// ============================================================
// vpxtool answering "vpxtool unknown" to --version, through main.js on the
// fake host: nothing is replaced on a guess. The answer goes to the Error
// Log, no version is remembered, and the Settings show no vpxtool line.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLines } from "../support/error_log.js";
import { drawnMenuLines } from "../drawn_menu/drawn_menu_reader.js";
import { openSettings } from "../settings/install_vpxtool_scenario.js";
import {
    startForScriptReader, pickHurriedly, vpxtoolAnswering, SCRIPT_READER_STATE_FILE, VERSION_READ_MS,
} from "./script_reader_prompt_scenario.js";

test("an unreadable vpxtool version is logged, and nothing is offered", async () => {
    const start = await startForScriptReader({ adminProfiles: ["Alice"], vpxtool: vpxtoolAnswering({ output: "vpxtool unknown\n" }) });
    const { fake } = start;
    assert.equal(start.dialog, null);
    await pickHurriedly(start);
    fake.advanceTime(VERSION_READ_MS);

    assert.equal(fake.readFile(SCRIPT_READER_STATE_FILE) ?? null, null);
    openSettings(fake);
    assert.equal(drawnMenuLines(fake).some(line => line.includes("vpxtool")), false);
    assert.deepEqual(errorLines(fake), [
        "[TableRoms] ERROR vpxtool's version unreadable: no version in \"vpxtool unknown\"; no install or update offered.",
    ]);
});
