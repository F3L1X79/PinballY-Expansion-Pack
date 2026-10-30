// ============================================================
// vpxtool newer than the Script Reader Version, remembered at an earlier
// start, through main.js on the fake host: never downgraded; no prompt and
// the Settings line greyed with its own version, which choosing does not open.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readDrawnMenu, chooseEntry, OPEN_OVER_MS } from "../drawn_menu/drawn_menu_reader.js";
import { openSettings } from "../settings/install_vpxtool_scenario.js";
import { startForScriptReader, pickHurriedly, vpxtoolAnswering, VERSION_READ_MS } from "./script_reader_prompt_scenario.js";

test("vpxtool v0.39.0: nothing offered, the Settings line greyed with v0.39.0 up to date", async () => {
    const start = await startForScriptReader({
        adminProfiles: ["Alice"], vpxtool: vpxtoolAnswering({ output: "vpxtool git:v0.39.0\n" }), rememberedVersion: "0.39.0",
    });
    const { fake } = start;
    assert.equal(start.dialog, null);
    await pickHurriedly(start);
    fake.advanceTime(VERSION_READ_MS);

    openSettings(fake);
    const line = readDrawnMenu(fake).rows.find(row => row.title === "Update vpxtool");
    assert.equal(line.reason, "vpxtool v0.39.0 is up to date");
    chooseEntry(fake, "Update vpxtool");
    fake.advanceTime(OPEN_OVER_MS);
    assert.equal(readDrawnMenu(fake).rows.some(row => row.title === "Update"), false, "the greyed line opens nothing");
    assert.deepEqual(fake.scriptReaderInstallsAsked(), []);
    assertNoErrorLogged(fake);
});
