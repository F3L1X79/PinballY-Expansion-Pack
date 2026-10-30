// ============================================================
// An older vpxtool with no version remembered yet, through main.js on the
// fake host: no prompt at this start; its --version, read past the Table
// ROMs Add-on's startup delay, is remembered for the next start's prompt, and
// the Settings offer the update at once.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { drawnMenuLines } from "../drawn_menu/drawn_menu_reader.js";
import { openSettings } from "../settings/install_vpxtool_scenario.js";
import {
    startForScriptReader, pickHurriedly, vpxtoolAnswering, rememberedVersionFile, SCRIPT_READER_STATE_FILE, VERSION_READ_MS,
} from "./script_reader_prompt_scenario.js";

test("vpxtool cargo:0.37.1 is read and remembered; the Settings offer its update", async () => {
    const start = await startForScriptReader({ adminProfiles: ["Alice"], vpxtool: vpxtoolAnswering({ output: "vpxtool cargo:0.37.1\r\n" }) });
    const { fake } = start;
    assert.equal(start.dialog, null, "no version known at this start");
    assert.equal(fake.readFile(SCRIPT_READER_STATE_FILE) ?? null, null, "read past the startup delay");

    await pickHurriedly(start);
    fake.advanceTime(VERSION_READ_MS);
    assert.equal(fake.readFile(SCRIPT_READER_STATE_FILE), rememberedVersionFile("0.37.1"));
    openSettings(fake);
    assert.ok(drawnMenuLines(fake).includes("Update vpxtool (v0.37.1 → v0.38.0)"));
    assertNoErrorLogged(fake);
});
