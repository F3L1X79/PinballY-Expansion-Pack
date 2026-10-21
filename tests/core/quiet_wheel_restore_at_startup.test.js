// ============================================================
// Quiet wheel after a crash: a pending file left by the last session puts the
// table's original volume back at startup, before the veil lowers it again.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const PROJECT = "C:\\PinballY\\Scripts\\ExpansionPack";
const PENDING_FILE = `${PROJECT}\\quiet_wheel_pending.json`;
// Left at 50 by the crash; its owner set it at 81.
const TABLES = [
    { id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", audioVolume: 50 },
];

test("a table left lowered gets its volume back before the veil's drop", async () => {
    const fake = createFakePinballYHost({ tables: TABLES });
    fake.addFile(`${PROJECT}\\profiles\\Alice\\profile.json`, JSON.stringify({ version: 1, notified: [] }));
    fake.addFile(`${PROJECT}\\profiles\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    fake.addFile(PENDING_FILE, JSON.stringify({ configId: TABLES[0].configId, title: "Medieval Madness", original: 81, quiet: 50 }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["startupChoicePrompt", "profilePicker"].includes(key);
    config.language = "en";

    await import("../../main.js");
    assert.deepEqual(fake.gameUpdates(), [
        { configId: TABLES[0].configId, changes: { audioVolume: 81 } },
        { configId: TABLES[0].configId, changes: { audioVolume: 50 } },
    ], "put back, then lowered from the restored value");
    assert.equal(JSON.parse(fake.readFile(PENDING_FILE)).original, 81, "the new drop keeps the true original");
    const restoreLines = fake.logLines().filter(line => line.startsWith("[QuietWheel] Restored"));
    assert.equal(restoreLines.length, 1);
    assert.ok(restoreLines[0].includes("\"Medieval Madness\"") && restoreLines[0].includes("to 81"), restoreLines[0]);
    assertNoErrorLogged(fake);
});
