// ============================================================
// Quiet wheel at a Welcome Screen startup: the selected table's audioVolume
// drops to half from the veil's first frame, once only through the Welcome
// Screen, and comes back when the screen closes.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { WELCOME_SCREEN_OPEN_MS, press, isWelcomeScreenOpen } from "../welcome_screen/welcome_screen_reader.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const TABLES = [
    { id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", audioVolume: 81 },
    { id: 2, configId: "Attack from Mars (Bally 1995)", title: "Attack from Mars", audioVolume: 100 },
];
// The short hand-over before the volume comes back, and a little more.
const HANDOVER_OVER_MS = 200;

test("the veil lowers the selected table from its first frame, and the Welcome Screen's close brings it back", async () => {
    const fake = createFakePinballYHost({ tables: TABLES });
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({ version: 1, notified: [] }));
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["startupChoicePrompt", "profilePicker"].includes(key);
    config.language = "en";

    await import("../../main.js");
    const lowered = [{ configId: TABLES[0].configId, changes: { audioVolume: 41 } }];
    assert.deepEqual(fake.gameUpdates(), lowered, "halved, rounded, as the veil dims the wheel");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true);
    assert.deepEqual(fake.gameUpdates(), lowered, "no second drop when the Welcome Screen takes over");

    press(fake, "Exit");
    assert.equal(isWelcomeScreenOpen(fake), false);
    fake.advanceTime(HANDOVER_OVER_MS);
    assert.deepEqual(fake.gameUpdates(), [...lowered, { configId: TABLES[0].configId, changes: { audioVolume: 81 } }], "back once the screen closes");
    assert.equal(fake.getGameInfo(TABLES[0].configId).audioVolume, 81);
    const quietLines = fake.logLines().filter(line => line.startsWith("[QuietWheel]"));
    assert.equal(quietLines.length, 2, "the drop and the return logged");
    for (const line of quietLines) assert.ok(line.includes("\"Medieval Madness\" from") && line.includes("81") && line.includes("41"), line);
    assertNoErrorLogged(fake);
});
