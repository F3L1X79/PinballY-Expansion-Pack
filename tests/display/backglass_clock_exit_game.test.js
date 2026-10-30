// ============================================================
// Backglass Clock after Exit Game, through main.js on the fake PinballY
// globals: the window closes as after a table that ends on its own,
// hidden, lowered, and raised no more.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const TABLE = { id: 1, configId: "Medieval Madness", title: "Medieval Madness", manufacturer: "Williams", year: 1997 };

test("Exit Game closes the Backglass Clock like a table that ends on its own", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 30, 21, 47, 30), tables: [TABLE], monitorCount: 2 });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "backglassClock";

    await import("../../main.js");
    await settle();
    const [clock] = fake.mediaWindows();
    fake.playGame(TABLE);
    fake.gameStarted(TABLE);
    fake.advanceTime(3000);
    fake.openPauseMenu();
    fake.selectMenuItem("End Game");
    fake.gameOver(TABLE);
    await settle();

    const calls = clock.calls();
    assert.deepEqual(calls.slice(-2).map(({ call, visible, after }) => ({ call, visible, after })), [
        { call: "showWindow", visible: false, after: undefined },
        { call: "setWindowPos", visible: undefined, after: "NOTOPMOST" },
    ], "hidden and lowered");
    assert.equal(clock.isVisible(), false);
    fake.advanceTime(5 * 60 * 1000);
    assert.equal(clock.calls().length, calls.length, "no raise left after the game");
    assertNoErrorLogged(fake);
});
