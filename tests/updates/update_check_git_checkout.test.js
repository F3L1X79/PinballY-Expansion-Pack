// ============================================================
// Update Check in a pack installed with git (a .git folder in the pack
// folder): a PinballY start sends no request, git pull updates the pack.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker } from "../core/startup_picker_scenario.js";

test("a git checkout never asks GitHub at its start", async () => {
    const { fake, settle } = await startOnProfilePicker({
        seed: f => f.addFolder("C:\\PinballY\\Scripts\\ExpansionPack\\.git"),
    });
    await settle();

    assert.deepEqual(fake.httpRequests(), []);
    assertNoErrorLogged(fake);
});
