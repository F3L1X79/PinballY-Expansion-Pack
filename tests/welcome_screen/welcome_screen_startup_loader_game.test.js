// ============================================================
// The startup veil and Loader, through main.js on the fake PinballY
// globals with the Seamless Launch Overlay on: a table launched during the
// Welcome Screen's startup pause takes both away as its launch overlay
// shows, leaving the launch's own comet alone, and drops the screen.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readLoader, loaderLayerCount } from "../support/loader_reader.js";
import { WELCOME_SCREEN_OPEN_MS, isWelcomeScreenOpen, startupVeil } from "./welcome_screen_reader.js";

const TABLES = [{ id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness" }];

test("a table launched during the startup pause takes the veil and the startup comet away", async () => {
    const fake = createFakePinballYHost({ tables: TABLES });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["startupChoicePrompt", "seamlessLaunchOverlay"].includes(key);
    config.language = "en";
    await import("../../main.js");
    await settle();
    assert.equal(startupVeil(fake).shown, true);
    assert.equal(readLoader(fake).zIndex, 6099);

    const [game] = fake.getAllTables();
    fake.playGame(game);
    fake.fire("launchoverlayshow", { game });
    assert.deepEqual(startupVeil(fake), { shown: false }, "the veil goes as the launch shows");
    assert.equal(loaderLayerCount(fake), 1, "only the launch's comet");
    assert.equal(readLoader(fake).zIndex, 5999);

    fake.gameStarted(game);
    fake.fire("launchoverlaymessage", { id: "running", message: null, hideWheelImage: false });
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    fake.gameOver(game);
    fake.fire("launchoverlayhide", { game });
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), false, "the screen was dropped");
    assert.deepEqual(startupVeil(fake), { shown: false });
    assert.equal(loaderLayerCount(fake), 0);
    assertNoErrorLogged(fake);
});
