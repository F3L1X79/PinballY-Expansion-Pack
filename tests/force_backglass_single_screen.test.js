// ============================================================
// Force Backglass on a single screen, through main.js on the fake PinballY
// globals: with no second monitor for the backglass, the Add-on hides the
// backglass window at startup and after a game, since PinballY reopens it
// from its own saved setting and it then covers the whole playfield.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";

const TABLE = { id: 1, configId: "Medieval Madness", title: "Medieval Madness", manufacturer: "Williams", year: 1997 };

test("on a single screen the backglass window is hidden at startup and after a game", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 29, 10, 0, 0), tables: [TABLE], monitorCount: 1 });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "forceBackglass";

    await import("../main.js");
    await settle();
    assert.deepEqual(fake.backglassShowCalls(), [false], "hidden at startup");
    fake.gameStarted(TABLE);
    fake.gameOver(TABLE);
    await settle();

    assert.ok(fake.backglassShowCalls().length > 1, "hidden again after the game");
    assert.ok(fake.backglassShowCalls().every(visible => visible === false), "never shown");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
