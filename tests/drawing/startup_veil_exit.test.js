// ============================================================
// The startup Loader, through main.js on the fake PinballY globals: Exit
// pressed while the comet turns is swallowed, so PinballY never opens its
// Exit menu over a Startup Screen still getting ready; Next still moves the
// wheel. The comet goes once the Profile picker shows.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readLoader, loaderLayerCount } from "../support/loader_reader.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
// Past the Profile picker's startup pause.
const PICKER_OPEN_MS = 2000;

const press = (fake, buttonCommand) => fake.fire("commandbuttondown", { command: buttonCommand, repeat: false });

test("Exit is swallowed while the startup comet turns", async () => {
    const fake = createFakePinballYHost();
    for (const name of ["Alice", "Bob"]) fake.addFolder(`${PROFILES_FOLDER}\\${name}`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Bob" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "startupChoicePrompt" || key === "profilePicker";
    config.language = "en";

    await import("../../main.js");
    await settle();
    assert.equal(readLoader(fake).shown, true);

    assert.equal(press(fake, "Exit").defaultPrevented, true, "no Exit menu over the comet");
    assert.equal(press(fake, "Next").defaultPrevented, false, "the wheel still moves");
    assert.equal(readLoader(fake).shown, true, "the comet keeps turning");

    fake.advanceTime(PICKER_OPEN_MS);
    await settle();
    assert.equal(loaderLayerCount(fake), 0, "the carousel took the comet's place");
    assertNoErrorLogged(fake);
});
