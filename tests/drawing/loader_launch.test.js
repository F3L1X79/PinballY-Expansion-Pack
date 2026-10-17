// ============================================================
// The launch Loader, through main.js on the fake PinballY globals with the
// Seamless Launch Overlay on: the comet turns in the middle of the
// playfield screen, under the menus, from the launch overlay's show until
// the game plays, comes back while the table closes and is gone with the
// overlay; a launch that never plays keeps it until the overlay goes. It
// never takes a button.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readLoader, loaderLayerCount } from "../support/loader_reader.js";

const TABLE = { configId: "afm", title: "Attack from Mars" };
const fake = createFakePinballYHost({ now: new Date(2026, 9, 17, 20, 0, 0), tables: [TABLE] });
const game = fake.getAllTables()[0];
const message = id => fake.fire("launchoverlaymessage", { id, message: null, hideWheelImage: false });
const SHOWN = { shown: true, zIndex: 5999, scale: { ySpan: 0.07 }, position: { x: 0, y: 0 } };

// A button pressed while the comet turns: none of the pack's listeners takes it.
function assertButtonsPassThrough() {
    assert.equal(fake.fire("keydown", { key: "Enter", code: "Enter", repeat: false }).defaultPrevented, false, "a key goes through");
    assert.equal(fake.fire("command", { id: fake.getBuiltInCommand("PlayGame") }).defaultPrevented, false, "a command goes through");
}

test("the comet turns from the overlay's show until the game plays, and again while the table closes", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "seamlessLaunchOverlay";
    await import("../../main.js");
    await settle();
    assert.equal(loaderLayerCount(fake), 0, "no Loader layer before a launch");

    fake.fire("launchoverlayshow", { game });
    assert.deepEqual(readLoader(fake), SHOWN, "centred, 7 % high, just under the menus");
    message("init");
    message("launching");
    assert.deepEqual(readLoader(fake), SHOWN, "still turning while the table loads");
    assertButtonsPassThrough();

    message("running");
    assert.deepEqual(readLoader(fake), { shown: false }, "gone once the game plays");
    assert.equal(loaderLayerCount(fake), 0, "no Loader layer left while the game runs");

    message("terminating");
    assert.deepEqual(readLoader(fake), SHOWN, "back while the table closes");
    message("gameover");
    message("after");
    fake.fire("launchoverlayhide", { game });
    assert.deepEqual(readLoader(fake), { shown: false }, "gone with the overlay");
    assert.equal(loaderLayerCount(fake), 0);
    assertNoErrorLogged(fake);
});

test("a launch that never plays keeps the comet until the overlay goes", () => {
    fake.fire("launchoverlayshow", { game });
    message("init");
    message("launching");
    assert.deepEqual(readLoader(fake), SHOWN);
    fake.fire("launcherror", { game });
    assert.deepEqual(readLoader(fake), SHOWN, "still turning until the overlay goes");
    fake.fire("launchoverlayhide", { game });
    assert.equal(loaderLayerCount(fake), 0, "gone with the overlay");
    assertNoErrorLogged(fake);
});
