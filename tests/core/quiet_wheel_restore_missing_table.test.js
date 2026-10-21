// ============================================================
// Quiet wheel after a crash, when the lowered table has left the game list
// since: the pending file is logged and deleted, and startup goes on.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const PROJECT = "C:\\PinballY\\Scripts\\ExpansionPack";
const PENDING_FILE = `${PROJECT}\\quiet_wheel_pending.json`;
const TABLES = [
    { id: 1, configId: "Attack from Mars (Bally 1995)", title: "Attack from Mars", audioVolume: 100 },
];

test("a pending file naming a table no longer in the game list is logged and deleted", async () => {
    const fake = createFakePinballYHost({ tables: TABLES });
    fake.addFile(PENDING_FILE, JSON.stringify({ configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", original: 81, quiet: 50 }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    // No screen holds the wheel afterwards, so no new pending file.
    for (const key of Object.keys(config.addOns)) config.addOns[key] = false;
    config.language = "en";

    await import("../../main.js");
    assert.equal(fake.readFile(PENDING_FILE), undefined);
    assert.deepEqual(fake.gameUpdates(), []);
    const quietLines = fake.logLines().filter(line => line.startsWith("[QuietWheel]"));
    assert.equal(quietLines.length, 1);
    assert.ok(quietLines[0].includes("\"Medieval Madness\"") && quietLines[0].includes("no longer in the game list"), quietLines[0]);
    assertNoErrorLogged(fake);
});
