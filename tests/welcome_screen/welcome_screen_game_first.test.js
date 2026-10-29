// ============================================================
// Welcome Screen, through main.js on the fake PinballY globals: a table
// launched from a menu opened before the startup screen's turn drops the
// screen, which never shows after the game, and the queue moves on.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { WELCOME_SCREEN_OPEN_MS, isWelcomeScreenOpen } from "./welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const TABLES = [{ id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness" }];

test("a game started from a menu before the screen's turn drops the Welcome Screen", async () => {
    const fake = createFakePinballYHost({ tables: TABLES });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "startupChoicePrompt";
    config.language = "en";

    const { getWheelDialogs } = await import("../../common/core/wheel_dialog.js");
    await import("../../main.js");
    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    await settle();
    assert.equal(isWelcomeScreenOpen(fake), false, "not over the menu");

    // Play: the menu closes and the table launches.
    fake.closeMenu();
    const [game] = TABLES;
    fake.playGame(game);
    fake.gameStarted(game);
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    fake.gameOver(game);
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), false);
    assert.equal(getWheelDialogs().isIdle(), true, "the queue is free");
    assertNoErrorLogged(fake);
});
