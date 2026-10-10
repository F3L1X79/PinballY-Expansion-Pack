// ============================================================
// With the Drawn Menus Add-on turned off in addOns, through main.js on the
// fake PinballY globals, the main menu is PinballY's native one, with the
// pack's entries, and nothing is drawn; the wheel dialogs are native too,
// and their queue advances on the native dialog's close.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";
import { DRAWN_MENU_Z_INDEX } from "../../common/drawn_menu_painter.js";

const fake = createFakePinballYHost({ now: new Date(2026, 9, 10, 20, 0, 0) });
const isMenuLayer = layer => Object.values(DRAWN_MENU_Z_INDEX).includes(layer.zIndex);
let lang;

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key !== "drawnMenus";
    config.language = "en";
    ({ default: lang } = await import("../../common/i18n.js"));
    await import("../../main.js");
    await settle();
});

test("turned off, the main menu is native", () => {
    fake.openMainMenu();

    assert.equal(fake.currentMenu().id, "main");
    assert.ok(fake.currentMenu().items.some(item => item.title === lang.customMenuLabels.tableOfTheDay));
    assert.ok(!fake.drawingLayers().some(isMenuLayer));
    fake.closeMenu();
});

test("turned off, the wheel dialogs are native and their queue advances", async () => {
    const { getWheelDialogs, DIALOG_PRIORITY } = await import("../../common/wheel_dialog.js");
    // Past the Welcome Screen, which holds the queue at startup.
    while (fake.currentMenu() === null && !getWheelDialogs().isIdle()) {
        fake.fire("commandbuttondown", { command: "Exit", repeat: false });
        fake.advanceTime(1000);
        await settle();
    }
    for (const name of ["First", "Second"]) {
        getWheelDialogs().submit({ id: `dialog${name}`, message: name, buttons: [{ label: `${name} OK` }], priority: DIALOG_PRIORITY.RATING_PROMPT });
    }
    await settle();

    assert.equal(fake.currentMenu().id, "dialogFirst");
    assert.deepEqual(fake.currentMenu().options, { dialogStyle: true });
    fake.selectMenuItem("First OK");
    await settle();
    assert.equal(fake.currentMenu().id, "dialogSecond");
    fake.closeMenu();
    await settle();
    assert.equal(fake.currentMenu(), null);
    assert.ok(!fake.drawingLayers().some(isMenuLayer));
});
