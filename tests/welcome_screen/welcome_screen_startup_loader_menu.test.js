// ============================================================
// The startup veil and Loader, through main.js on the fake PinballY
// globals: a menu opened during the Welcome Screen's startup pause takes
// both away at once, and they do not come back with the screen once the
// wheel returns.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readLoader, loaderLayerCount } from "../support/loader_reader.js";
import { WELCOME_SCREEN_OPEN_MS, isWelcomeScreenOpen, startupVeil } from "./welcome_screen_reader.js";

test("a menu opened during the startup pause takes the veil and the comet away", async () => {
    const fake = createFakePinballYHost();
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "startupChoicePrompt";
    config.language = "en";
    await import("../../main.js");
    await settle();
    assert.equal(startupVeil(fake).shown, true);
    assert.equal(readLoader(fake).shown, true);

    fake.advanceTime(100);
    fake.openMainMenu();
    assert.deepEqual(startupVeil(fake), { shown: false }, "the veil goes with the menu");
    assert.equal(loaderLayerCount(fake), 0, "the comet goes with the menu");

    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    fake.closeMenu();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true, "the screen still shows once back on the wheel");
    assert.deepEqual(startupVeil(fake), { shown: false });
    assert.equal(loaderLayerCount(fake), 0);
    assertNoErrorLogged(fake);
});
