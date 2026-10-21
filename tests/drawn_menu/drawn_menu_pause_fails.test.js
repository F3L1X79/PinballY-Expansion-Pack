// ============================================================
// A drawn pause menu that fails to draw, through main.js on the fake
// PinballY globals: the error is logged, nothing stays drawn, and the
// native pause menu, never cancelled, shows with its buttons left to it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { errorLines } from "../support/error_log.js";
import { whileDrawsFail, FAILING_DRAW_MESSAGE } from "../support/failing_draws.js";
import { OPEN_OVER_MS, isAnythingDrawn } from "./drawn_menu_reader.js";

const ADD_ONS_UNDER_TEST = ["drawnMenus"];

const fake = createFakePinballYHost({ now: new Date(2026, 9, 21, 20, 0, 0) });

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";
    await import("../../main.js");
    await settle();
});

test("a failing draw leaves the native pause menu, nothing drawn", () => {
    whileDrawsFail(() => fake.openPauseMenu());
    fake.advanceTime(OPEN_OVER_MS);

    assert.equal(fake.currentMenu().id, "pause game");
    assert.equal(fake.currentMenu().items[0].title, "Resume Game");
    assert.ok(!isAnythingDrawn(fake));
    assert.ok(!fake.fire("commandbuttondown", { command: "Next", repeat: false }).defaultPrevented);
    fake.closeMenu();
});

test("only the failing draw is logged as an error", () => {
    const errors = errorLines(fake);
    assert.ok(errors.length > 0);
    assert.ok(errors.every(line => line.includes(FAILING_DRAW_MESSAGE)), errors.join("\n"));
});
