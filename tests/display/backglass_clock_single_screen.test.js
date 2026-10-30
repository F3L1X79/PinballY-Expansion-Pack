// ============================================================
// Backglass Clock on a single screen, through main.js on the fake PinballY
// globals: with no backglass screen, the window is never shown, so no box
// covers the playfield.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const TABLE = { id: 1, configId: "Medieval Madness", title: "Medieval Madness", manufacturer: "Williams", year: 1997 };

test("on a single screen the Backglass Clock never shows", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 30, 21, 47, 30), tables: [TABLE], monitorCount: 1 });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "backglassClock";

    await import("../../main.js");
    await settle();
    const [clock] = fake.mediaWindows();
    fake.playGame(TABLE);
    fake.gameStarted(TABLE);
    fake.advanceTime(3 * 60 * 1000);
    fake.gameOver(TABLE);
    await settle();

    assert.deepEqual(clock.calls(), [{ call: "showWindow", visible: false }], "only the hide at startup");
    assert.ok(clock.layers().every(layer => layer.texts().length === 0), "never drawn");
    assertNoErrorLogged(fake);
});
