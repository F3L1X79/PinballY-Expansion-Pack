// ============================================================
// A pack menu the Drawn Menu module cannot draw, through main.js on the
// fake PinballY globals: shown natively once, left native by the Drawn
// Menus Add-on on its "menuopen", and its onClose run on its "menuclose".
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { errorLines } from "../support/error_log.js";
import { whileDrawsFail, FAILING_DRAW_MESSAGE } from "../support/failing_draws.js";
import { OPEN_OVER_MS, isAnythingDrawn } from "./drawn_menu_reader.js";

const MENU_ID = "expansionPack.packMenu";

const fake = createFakePinballYHost({ now: new Date(2026, 9, 22, 20, 0, 0) });
let getDrawnMenus;
let items;

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "drawnMenus";
    config.language = "en";
    await import("../../main.js");
    await settle();
    fake.advanceTime(5000);
    ({ getDrawnMenus } = await import("../../common/drawn_menu/drawn_menu.js"));
    items = [{ title: "Go", cmd: 4500 }, { title: "Cancel", cmd: globalThis.command.MenuReturn }];
});

test("a pack menu that fails to draw shows natively once, left native on its menuopen, its close reported", () => {
    let closes = 0;
    const shownBefore = fake.shownMenus().length;
    whileDrawsFail(() => getDrawnMenus().show(MENU_ID, items, { onClose: () => { closes++; } }));

    assert.equal(fake.shownMenus().length, shownBefore + 1);
    assert.equal(fake.currentMenu().id, MENU_ID);
    const ev = fake.fire("menuopen", { id: MENU_ID, items, options: {} });
    fake.advanceTime(OPEN_OVER_MS);

    assert.ok(!ev.defaultPrevented, "the native menu is not cancelled");
    assert.ok(!isAnythingDrawn(fake));
    assert.equal(closes, 0);
    fake.closeMenu();
    assert.equal(closes, 1);
});

test("once closed, a menu with that id is drawn again", () => {
    const ev = fake.fire("menuopen", { id: MENU_ID, items, options: {} });
    fake.advanceTime(OPEN_OVER_MS);

    assert.ok(ev.defaultPrevented);
    assert.ok(isAnythingDrawn(fake));
    fake.fire("commandbuttondown", { command: "Exit", repeat: false });
});

test("only the failing draw is logged as an error", () => {
    const errors = errorLines(fake);
    assert.ok(errors.length > 0);
    assert.ok(errors.every(line => line.includes(FAILING_DRAW_MESSAGE)), errors.join("\n"));
});
