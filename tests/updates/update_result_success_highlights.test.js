// ============================================================
// The first start on the Pack Version an update installed, through main.js
// on the fake host: the success dialog lists that version's Release
// Highlights below its line, one per line, once; the request and the
// version it replaced are cleared.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readDrawnMenu, drawnMenuLines, isDrawnMenuShown, chooseEntry } from "../drawn_menu/drawn_menu_reader.js";
import { PACK_VERSION } from "../../common/core/pack_version.js";
import { startAfterUpdate, STATE_FILE } from "./update_result_success_scenario.js";

test("the success dialog lists the new version's Release Highlights", async () => {
    const { fake } = await startAfterUpdate({
        previousVersion: "0.0.1",
        releaseHighlights: { "0.0.1": ["Already there."], [PACK_VERSION]: ["Challenges now last a whole week.", "The wheel spins faster."] },
    });

    assert.equal(readDrawnMenu(fake).title, "Update complete");
    assert.equal(readDrawnMenu(fake).message, `Expansion Pack updated to v${PACK_VERSION}\n\n- Challenges now last a whole week.\n- The wheel spins faster.`);
    assert.deepEqual(drawnMenuLines(fake), ["OK"]);
    assert.deepEqual(JSON.parse(fake.readFile(STATE_FILE)), { version: 1, offeredVersion: PACK_VERSION }, "shown once");

    chooseEntry(fake, "OK");
    assert.equal(isDrawnMenuShown(fake), false);
    assertNoErrorLogged(fake);
});
