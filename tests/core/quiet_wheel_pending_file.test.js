// ============================================================
// Quiet wheel's pending file: it holds the lowered table's original volume
// from the veil's drop until the Welcome Screen's close brings it back.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { WELCOME_SCREEN_OPEN_MS, press } from "../welcome_screen/welcome_screen_reader.js";

const PROJECT = "C:\\PinballY\\Scripts\\ExpansionPack";
const PENDING_FILE = `${PROJECT}\\quiet_wheel_pending.json`;
const TABLES = [
    { id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", audioVolume: 81 },
];
// The short hand-over before the volume comes back, and a little more.
const HANDOVER_OVER_MS = 200;

test("the pending file holds the original volume exactly while the table is lowered", async () => {
    const fake = createFakePinballYHost({ tables: TABLES });
    fake.addFile(`${PROJECT}\\profiles\\Alice\\profile.json`, JSON.stringify({ version: 1, notified: [] }));
    fake.addFile(`${PROJECT}\\profiles\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["startupChoicePrompt", "profilePicker"].includes(key);
    config.language = "en";

    await import("../../main.js");
    assert.deepEqual(JSON.parse(fake.readFile(PENDING_FILE)), {
        configId: TABLES[0].configId, title: "Medieval Madness", original: 81, quiet: 50,
    }, "written at the drop");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);

    press(fake, "Exit");
    fake.advanceTime(HANDOVER_OVER_MS);
    assert.equal(fake.getGameInfo(TABLES[0].configId).audioVolume, 81);
    assert.equal(fake.readFile(PENDING_FILE), undefined, "deleted at the return");
    assertNoErrorLogged(fake);
});
