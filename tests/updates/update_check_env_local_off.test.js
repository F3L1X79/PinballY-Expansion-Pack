// ============================================================
// Update Check turned off in .env.local: a PinballY start sends no request.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const PROJECT = "C:\\PinballY\\Scripts\\ExpansionPack";

test("UPDATE_CHECK=false in .env.local: no request at the start", async () => {
    const fake = createFakePinballYHost();
    fake.addFile(`${PROJECT}\\.env.local`, "UPDATE_CHECK=false\r\n");
    fake.addFile(`${PROJECT}\\profiles\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "guest" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();

    // Imported after the globals, so the configuration reads .env.local.
    const { default: config } = await import("../../common/core/config.js");
    assert.equal(config.updateCheck, false);
    await import("../../main.js");
    await settle();

    assert.deepEqual(fake.httpRequests(), []);
    assertNoErrorLogged(fake);
});
