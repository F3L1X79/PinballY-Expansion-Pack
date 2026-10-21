// ============================================================
// Quiet wheel after a crash that cut its pending file short: the file is
// logged and deleted, and the veil still lowers the table as usual.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { errorLines } from "../support/error_log.js";

const PROJECT = "C:\\PinballY\\Scripts\\ExpansionPack";
const PENDING_FILE = `${PROJECT}\\quiet_wheel_pending.json`;
const TABLES = [
    { id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", audioVolume: 81 },
];

test("an unreadable pending file is logged and deleted, and the wheel is still lowered", async () => {
    const fake = createFakePinballYHost({ tables: TABLES });
    fake.addFile(`${PROJECT}\\profiles\\Alice\\profile.json`, JSON.stringify({ version: 1, notified: [] }));
    fake.addFile(`${PROJECT}\\profiles\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    fake.addFile(PENDING_FILE, "{ \"configId\": \"Medieval Ma");
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["startupChoicePrompt", "profilePicker"].includes(key);
    config.language = "en";

    await import("../../main.js");
    const errors = errorLines(fake);
    assert.equal(errors.length, 1, errors.join("\n"));
    assert.ok(errors[0].startsWith("[QuietWheel]") && errors[0].includes("quiet_wheel_pending.json"), errors[0]);
    assert.deepEqual(fake.gameUpdates(), [{ configId: TABLES[0].configId, changes: { audioVolume: 50 } }], "the veil's drop as usual");
    assert.equal(JSON.parse(fake.readFile(PENDING_FILE)).original, 81, "a fresh file for this drop");
});
