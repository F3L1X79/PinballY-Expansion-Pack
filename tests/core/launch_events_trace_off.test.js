// ============================================================
// The launch events trace through main.js with LOG_LAUNCH_EVENTS left off
// (the default): its Add-on is on, yet a launch logs no trace line.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const TABLE = { configId: "afm", title: "Attack from Mars" };

test("with the flag off, a launch logs no launch event line", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 22, 20, 0, 0), tables: [TABLE] });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "launchEventsTrace";
    await import("../../main.js");
    await settle();
    const game = fake.getAllTables()[0];

    fake.playGame(game);
    fake.gameStarted(game);
    fake.gameOver(game);
    fake.playGame(game);
    fake.launchError(game);

    assert.deepEqual(fake.logLines().filter(line => line.startsWith("[LaunchEvents]")), []);
    assertNoErrorLogged(fake);
});
