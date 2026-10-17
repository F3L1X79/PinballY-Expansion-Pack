// ============================================================
// With the Welcome Screen off, through main.js on the fake PinballY
// globals: no startup veil nor Loader over the wheel.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { loaderLayerCount } from "../support/loader_reader.js";
import { WELCOME_SCREEN_OPEN_MS, startupVeil } from "./welcome_screen_reader.js";

test("with the Welcome Screen off, the wheel shows bare at startup", async () => {
    const fake = createFakePinballYHost();
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key !== "startupChoicePrompt";
    config.language = "en";
    await import("../../main.js");
    assert.deepEqual(startupVeil(fake), { shown: false });
    assert.equal(loaderLayerCount(fake), 0);
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.deepEqual(startupVeil(fake), { shown: false });
    assert.equal(loaderLayerCount(fake), 0);
    assertNoErrorLogged(fake);
});
