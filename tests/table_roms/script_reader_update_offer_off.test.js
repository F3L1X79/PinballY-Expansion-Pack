// ============================================================
// An older vpxtool with "Offer vpxtool" off, through main.js on the fake
// host: as for a missing one, no prompt at startup, and the Settings line
// still offers the update.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { drawnMenuLines } from "../drawn_menu/drawn_menu_reader.js";
import { openSettings } from "../settings/install_vpxtool_scenario.js";
import { startForScriptReader, pickHurriedly, vpxtoolAnswering } from "./script_reader_prompt_scenario.js";

test("Offer vpxtool off: no update prompt, the Settings line stays", async () => {
    const start = await startForScriptReader({
        adminProfiles: ["Alice"], settings: { offerVpxtool: false },
        vpxtool: vpxtoolAnswering({ output: "vpxtool git:v0.37.1\n" }), rememberedVersion: "0.37.1",
    });
    const { fake } = start;
    assert.equal(start.dialog, null);
    await pickHurriedly(start);

    openSettings(fake);
    assert.ok(drawnMenuLines(fake).includes("Update vpxtool (v0.37.1 → v0.38.0)"));
    assertNoErrorLogged(fake);
});
