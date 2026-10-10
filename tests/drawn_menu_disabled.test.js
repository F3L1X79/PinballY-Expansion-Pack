// ============================================================
// With the Drawn Menus Add-on turned off in addOns, through main.js on the
// fake PinballY globals, the main menu is PinballY's native one, with the
// pack's entries, and nothing is drawn.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { DRAWN_MENU_Z_INDEX } from "../common/drawn_menu_painter.js";

test("turned off, the main menu is native", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 10, 20, 0, 0) });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key !== "drawnMenus";
    config.language = "en";
    const { default: lang } = await import("../common/i18n.js");
    await import("../main.js");
    await settle();

    fake.openMainMenu();

    assert.equal(fake.currentMenu().id, "main");
    assert.ok(fake.currentMenu().items.some(item => item.title === lang.customMenuLabels.tableOfTheDay));
    assert.ok(!fake.drawingLayers().some(layer => Object.values(DRAWN_MENU_Z_INDEX).includes(layer.zIndex)));
});
