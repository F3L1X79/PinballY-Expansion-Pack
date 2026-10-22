// ============================================================
// Quiet wheel and a table launched from the wheel under the startup veil:
// the veil gives way to the launch overlay and the lowered table is back at
// its own volume at once, with no hand-over.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const TABLES = [{ id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", audioVolume: 80 }];

test("a launch under the startup veil brings the volume back as its overlay shows", async () => {
    const fake = createFakePinballYHost({ tables: TABLES });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["startupChoicePrompt", "seamlessLaunchOverlay"].includes(key);
    config.language = "en";
    await import("../../main.js");
    await settle();
    assert.equal(fake.getGameInfo(TABLES[0].configId).audioVolume, 50);

    const [game] = fake.getAllTables();
    fake.playGame(game);
    assert.deepEqual(fake.gameUpdates().map(update => update.changes.audioVolume), [50, 80], "back as the overlay shows");
    assertNoErrorLogged(fake);
});
