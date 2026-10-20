// ============================================================
// An unknown startupScreen value: PinballY starts on the Welcome Screen,
// with its veil and Loader, and the log names the accepted values.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { readLoader } from "../support/loader_reader.js";
import { isWelcomeScreenOpen, startupVeil, WELCOME_SCREEN_OPEN_MS } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";

test("a mistyped Startup Screen falls back to the Welcome Screen, naming the accepted values", async () => {
    const fake = createFakePinballYHost();
    fake.addFolder(`${PROFILES_FOLDER}\\Alice`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "startupChoicePrompt" || key === "profilePicker";
    config.language = "en";
    config.startupScreen = "profilepicker";

    await import("../../main.js");
    assert.equal(startupVeil(fake).shown, true, "the startup veil");
    assert.equal(readLoader(fake).shown, true, "the Loader");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true, "the Welcome Screen");
    assert.deepEqual(fake.logLines().filter(line => line.includes("startupScreen")),
        ["[Config] startupScreen \"profilepicker\" is not one of welcome, profilePicker, wheel; starting on the Welcome Screen."]);
    assertNoErrorLogged(fake);
});
