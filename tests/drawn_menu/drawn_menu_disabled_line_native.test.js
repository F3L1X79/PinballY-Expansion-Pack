// ============================================================
// A disabled line in a menu shown natively, through main.js on the fake
// PinballY globals with the Drawn Menus Add-on off: titled "<label>
// (<reason>)", and choosing it shows the same menu again with the cursor
// on it, its own command never heard and its onClose run once, at the end.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const MENU_ID = "expansionPack.disabledLine";
const GO = 4500;
const LOCKED = 4501;

const fake = createFakePinballYHost({ now: new Date(2026, 9, 29, 20, 0, 0) });
const heardCommands = [];
let getDrawnMenus;
let items;
let closes = 0;

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = false;
    config.language = "en";
    await import("../../main.js");
    await settle();
    fake.advanceTime(5000);
    ({ getDrawnMenus } = await import("../../common/drawn_menu/drawn_menu.js"));
    globalThis.mainWindow.on("command", ev => { heardCommands.push(ev.id); });
    items = [
        { title: "Go", cmd: GO, selected: true },
        { title: "Locked", cmd: LOCKED, disabled: true, reason: "Not today" },
        { title: "Cancel", cmd: globalThis.command.MenuReturn },
    ];
});

const titles = () => fake.currentMenu().items.map(item => item.title);
const selectedTitle = () => fake.currentMenu().items.find(item => item.selected).title;

test("the disabled line shows its reason in brackets", () => {
    getDrawnMenus().show(MENU_ID, items, { onClose: () => { closes++; } });

    assert.equal(fake.currentMenu().id, MENU_ID);
    assert.deepEqual(titles(), ["Go", "Locked (Not today)", "Cancel"]);
    assert.ok(fake.currentMenu().items.every(item => !("disabled" in item) && !("reason" in item)), "only PinballY's own properties");
});

test("choosing it shows the same menu again, the cursor on that line", () => {
    const shownBefore = fake.shownMenus().length;
    fake.selectMenuItem("Locked (Not today)");

    assert.equal(fake.shownMenus().length, shownBefore + 1);
    assert.equal(fake.currentMenu().id, MENU_ID);
    assert.deepEqual(titles(), ["Go", "Locked (Not today)", "Cancel"]);
    assert.equal(selectedTitle(), "Locked (Not today)");
    assert.ok(!heardCommands.includes(LOCKED), "the line's own command never runs");
    assert.equal(closes, 0, "the menu shown again is not closed");
});

test("chosen again, it still shows the menu again", () => {
    fake.selectMenuItem("Locked (Not today)");

    assert.equal(fake.currentMenu().id, MENU_ID);
    assert.equal(selectedTitle(), "Locked (Not today)");
    assert.equal(closes, 0);
});

test("the other lines run their command, and the close is reported once", () => {
    fake.selectMenuItem("Go");

    assert.equal(heardCommands.at(-1), GO);
    assert.equal(fake.currentMenu(), null);
    assert.equal(closes, 1);
});

test("no error is logged", () => {
    assertNoErrorLogged(fake);
});
