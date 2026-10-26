// ============================================================
// The startup veil and Loader, through main.js on the fake PinballY
// globals: attract mode starting during the Welcome Screen's startup
// pause drops the screen and takes both away at once, the lowered table
// back at its own volume with them.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readLoader, loaderLayerCount } from "../support/loader_reader.js";
import { WELCOME_SCREEN_OPEN_MS, isWelcomeScreenOpen, startupVeil } from "./welcome_screen_reader.js";

const TABLES = [{ id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", audioVolume: 100 }];

test("attract mode during the startup pause takes the veil and the comet away", async () => {
    const fake = createFakePinballYHost({ tables: TABLES });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "startupChoicePrompt";
    config.language = "en";
    await import("../../main.js");
    await settle();
    assert.equal(startupVeil(fake).shown, true);
    assert.equal(readLoader(fake).shown, true);

    fake.advanceTime(100);
    fake.enterAttractMode();
    assert.deepEqual(startupVeil(fake), { shown: false }, "the veil goes with attract mode");
    assert.equal(loaderLayerCount(fake), 0, "the comet goes with attract mode");
    assert.deepEqual(fake.gameUpdates().map(update => update.changes.audioVolume), [50, 100], "the table back at its own volume at once");
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), false, "the screen was dropped");
    assertNoErrorLogged(fake);
});
