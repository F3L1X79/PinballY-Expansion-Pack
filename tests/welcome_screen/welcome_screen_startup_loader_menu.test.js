// ============================================================
// The startup veil and Loader, through main.js on the fake PinballY
// globals: a menu opened before the startup Welcome Screen's turn takes
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

test("a menu opened before the screen's turn takes the veil and the comet away", async () => {
    const fake = createFakePinballYHost();
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "startupChoicePrompt";
    config.language = "en";
    await import("../../main.js");
    assert.equal(startupVeil(fake).shown, true);
    assert.equal(readLoader(fake).shown, true);

    fake.openMainMenu();
    await settle();
    assert.deepEqual(startupVeil(fake), { shown: false }, "the veil goes with the menu");
    assert.equal(loaderLayerCount(fake), 0, "the comet goes with the menu");

    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    fake.closeMenu();
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true, "the screen still shows once back on the wheel");
    assert.deepEqual(startupVeil(fake), { shown: false });
    assert.equal(loaderLayerCount(fake), 0);
    assertNoErrorLogged(fake);
});
