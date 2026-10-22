// ============================================================
// The pause menu when a game ends under it, as seen on the cabinet during
// a media capture: during a capture it stays native, never drawn; a drawn
// pause menu still open when the game ends comes down at "postlaunch",
// cover included, instead of leaving a black screen that swallows every press.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { isDrawnMenuShown, isAnythingDrawn, press, openPauseMenu } from "./drawn_menu_reader.js";

const ADD_ONS_UNDER_TEST = ["drawnMenus"];
const PAUSE_MENU_ID = "pause game";
const TABLE = {
    id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness (Williams 1997)",
    manufacturer: "Williams", year: 1997, categories: [], playCount: 0, playTime: 0, lastPlayed: null, rating: 0, isHidden: false,
};

const fake = createFakePinballYHost({ now: new Date(2026, 9, 22, 12, 48, 0), tables: [TABLE] });
const pauseOpenings = [];

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";
    await import("../../main.js");
    await settle();
    fake.on("menuopen", ev => {
        if (ev.id === PAUSE_MENU_ID) pauseOpenings.push(ev.defaultPrevented);
    });
});

test("during a capture the pause menu stays native: nothing drawn, no press swallowed", () => {
    fake.gameStarted(TABLE, { capture: "single" });
    openPauseMenu(fake);

    assert.ok(!isAnythingDrawn(fake));
    assert.deepEqual(pauseOpenings, [false, false]);
    assert.equal(fake.currentMenu().id, PAUSE_MENU_ID);
    assert.ok(!press(fake, "Next").defaultPrevented);

    fake.gameOverUnderPauseMenu(TABLE);
    fake.pressExitInMenu();
    assert.equal(fake.currentMenu(), null);
});

test("a game ending under the drawn pause menu takes it down at postlaunch, cover included", () => {
    fake.gameStarted(TABLE);
    openPauseMenu(fake);
    assert.ok(isDrawnMenuShown(fake));

    fake.gameOverUnderPauseMenu(TABLE);

    assert.ok(!isAnythingDrawn(fake), "no black cover left over the native menu");
    assert.ok(!press(fake, "Exit").defaultPrevented, "the native menu hears the presses again");
    fake.pressExitInMenu();
});

test("no error was logged", () => {
    assertNoErrorLogged(fake);
});
