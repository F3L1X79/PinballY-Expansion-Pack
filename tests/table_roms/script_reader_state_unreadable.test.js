// ============================================================
// A Script Reader state file cut by a crash, through main.js on the fake
// host: logged, deleted, and the start goes on as if no version was
// remembered; the version read at this start is then remembered again.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLines } from "../support/error_log.js";
import {
    startForScriptReader, pickHurriedly, vpxtoolAnswering, rememberedVersionFile, SCRIPT_READER_STATE_FILE, VERSION_READ_MS,
} from "./script_reader_prompt_scenario.js";

test("a truncated state file is logged and deleted, and the start goes on", async () => {
    const start = await startForScriptReader({
        adminProfiles: ["Alice"], vpxtool: vpxtoolAnswering({ output: "vpxtool git:v0.37.1\n" }), rememberedVersion: "{\"vpxtoolVers",
    });
    const { fake } = start;
    assert.equal(start.dialog, null, "no version remembered");
    assert.equal(fake.readFile(SCRIPT_READER_STATE_FILE) ?? null, null, "deleted");
    const { carouselOpen } = await pickHurriedly(start);
    assert.equal(carouselOpen, true, "the start goes on");

    fake.advanceTime(VERSION_READ_MS);
    assert.equal(fake.readFile(SCRIPT_READER_STATE_FILE), rememberedVersionFile("0.37.1"));
    assert.equal(errorLines(fake).length, 1);
    assert.match(errorLines(fake)[0], /^\[TableRoms\] ERROR reading script_reader\.json, deleted: /);
});
