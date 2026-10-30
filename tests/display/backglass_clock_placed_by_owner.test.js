// ============================================================
// Backglass Clock, through main.js on the fake PinballY globals: a window
// the owner already placed on the backglass screen (PinballY restores it
// from its settings) keeps its place and size at every game.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const TABLE = { id: 1, configId: "Medieval Madness", title: "Medieval Madness", manufacturer: "Williams", year: 1997 };
const BACKGLASS_RECT = { left: 2560, top: 0, right: 4480, bottom: 1080 };
// Bottom right of the backglass screen, larger than the default.
const OWNER_PLACE = { left: 3900, top: 880, right: 4480, bottom: 1080 };

test("a Backglass Clock the owner placed on the backglass screen stays where it is", async () => {
    const fake = createFakePinballYHost({
        tables: [TABLE], monitorCount: 2, backglassWindowRect: BACKGLASS_RECT,
        savedMediaWindowRects: { BackglassClock: OWNER_PLACE },
    });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "backglassClock";
    config.language = "en";

    await import("../../main.js");
    await settle();
    const [clock] = fake.mediaWindows();

    fake.playGame(TABLE);
    fake.gameStarted(TABLE);
    assert.equal(clock.isVisible(), true);
    assert.deepEqual(clock.windowRect(), OWNER_PLACE, "neither moved nor resized");
    assert.ok(clock.calls().filter(entry => entry.call === "setWindowPos").every(entry => entry.after === "TOPMOST"),
        "only raised");
    assert.ok(!fake.logLines().some(line => line.includes("[BackglassClock]")), "nothing to report");
    assertNoErrorLogged(fake);
});
