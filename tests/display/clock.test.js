// ============================================================
// Clock, through main.js on the fake PinballY globals: the time drawn at
// the top left of the wheel screen on its own canvas (so its proportions
// never depend on the window size at startup), in the language's format;
// it changes when the minute does, hides while a game runs and comes back
// on the wheel.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";

const CLOCK_Z = 4500;
const GAME = { id: 1, configId: "mm", title: "Medieval Madness" };

function clock(fake) {
    const layers = fake.drawingLayers().filter(layer => layer.zIndex === CLOCK_Z);
    assert.equal(layers.length, 1, "one clock layer");
    return layers[0];
}

test("the clock shows the time, follows the minutes and hides during a game", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 26, 21, 47, 30) });
    fake.setTables([GAME]);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "clock";
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    await import("../../main.js");
    await settle();

    const { width, height } = clock(fake).canvasSize();
    fake.setLayoutSize({ width: 1080, height: 1920 });
    assert.ok(width < 400 && height < 400, "its own canvas, not the window's");
    assert.deepEqual(Object.keys(clock(fake).scale()), ["ySpan"], "only one span set, so it keeps its proportions");
    assert.equal(clock(fake).position().align, "top left");

    assert.ok(clock(fake).texts().includes(lang.clock.time(21, 47)), "the time at startup");
    fake.advanceTime(29 * 1000);
    assert.ok(clock(fake).texts().includes(lang.clock.time(21, 47)), "still the same minute");
    fake.advanceTime(1000);
    assert.ok(clock(fake).texts().includes(lang.clock.time(21, 48)), "redrawn when the minute changes");
    assert.ok(!clock(fake).texts().includes(lang.clock.time(21, 47)));
    fake.advanceTime(60 * 1000);
    assert.ok(clock(fake).texts().includes(lang.clock.time(21, 49)), "and every minute after");

    fake.gameStarted(GAME);
    assert.equal(clock(fake).alpha, 0, "hidden while a game runs");
    fake.advanceTime(10 * 60 * 1000);
    fake.gameOver(GAME);
    assert.equal(clock(fake).alpha, 1, "back on the wheel");
    assert.ok(clock(fake).texts().includes(lang.clock.time(21, 59)), "on time after the game");

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
