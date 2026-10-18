// ============================================================
// A Drawn main menu that fails to draw, through main.js on the fake
// PinballY globals: PinballY's native items show, their entry naming the
// Active Filter rather than "Change Filter".
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { errorLines } from "../support/error_log.js";
import { whileDrawsFail, FAILING_DRAW_MESSAGE } from "../support/failing_draws.js";

const ADD_ONS_UNDER_TEST = ["uiTranslation", "customMenuCommands", "drawnMenus"];

const fake = createFakePinballYHost({ now: new Date(2026, 9, 15, 20, 0, 0) });

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";
    await import("../../main.js");
    await settle();
});

test("a failing draw leaves the native entry naming the Active Filter", () => {
    whileDrawsFail(() => fake.openMainMenu());

    const titles = fake.currentMenu().items.map(item => item.title);
    assert.ok(titles.includes("Active filter: All Tables"));
    assert.ok(!titles.includes("Change Filter"));
    fake.closeMenu();
});

test("only the failing draw is logged as an error", () => {
    const errors = errorLines(fake);
    assert.ok(errors.length > 0);
    assert.ok(errors.every(line => line.includes(FAILING_DRAW_MESSAGE)), errors.join("\n"));
});
