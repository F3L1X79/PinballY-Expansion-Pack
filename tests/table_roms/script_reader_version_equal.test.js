// ============================================================
// vpxtool at the Script Reader Version, remembered at an earlier start,
// through main.js on the fake host: no prompt, nothing installed, and the
// Settings line greyed as up to date.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readDrawnMenu } from "../drawn_menu/drawn_menu_reader.js";
import { openSettings } from "../settings/install_vpxtool_scenario.js";
import { startForScriptReader, pickHurriedly, vpxtoolAnswering, VERSION_READ_MS } from "./script_reader_prompt_scenario.js";

test("vpxtool v0.38.0: nothing offered, the Settings line greyed as up to date", async () => {
    const start = await startForScriptReader({
        adminProfiles: ["Alice"], vpxtool: vpxtoolAnswering({ output: "vpxtool git:v0.38.0\n" }), rememberedVersion: "0.38.0",
    });
    const { fake } = start;
    assert.equal(start.dialog, null);
    await pickHurriedly(start);
    fake.advanceTime(VERSION_READ_MS);

    openSettings(fake);
    const line = readDrawnMenu(fake).rows.find(row => row.title === "Update vpxtool");
    assert.equal(line.reason, "vpxtool v0.38.0 is up to date");
    assert.deepEqual(fake.scriptReaderInstallsAsked(), []);
    assertNoErrorLogged(fake);
});
