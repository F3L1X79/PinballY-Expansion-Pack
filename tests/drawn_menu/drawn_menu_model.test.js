// ============================================================
// What a Drawn Menu shows of PinballY's items, through main.js on the
// fake PinballY globals with only the Drawn Menus Add-on on: the paging
// entries are gone, a titled static item is a heading the cursor skips,
// runs of separators collapse to one and none starts or ends the list,
// checked and radio entries carry a gold mark and a submenu entry a gold
// chevron, and the cursor opens on the item marked "selected".
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";
import { readDrawnMenu, highlightedEntry, press, OPEN_OVER_MS } from "./drawn_menu_reader.js";

const fake = createFakePinballYHost({ now: new Date(2026, 9, 10, 20, 0, 0) });
let COMMAND;

function openMain(items) {
    fake.openMenu("main", items);
    fake.advanceTime(OPEN_OVER_MS);
}

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "drawnMenus";
    await import("../../main.js");
    await settle();
    COMMAND = globalThis.command;
});

test("paging entries are gone, separators collapse, and a heading is shown but skipped", () => {
    openMain([
        { title: "", cmd: -1 },
        { title: "Eras", cmd: -1 },
        { title: "1970s", cmd: 101 },
        { title: "", cmd: -1 },
        { cmd: -1 },
        { title: "1980s", cmd: 102 },
        { title: "More", cmd: COMMAND.MenuPageDown },
        { title: "Back", cmd: COMMAND.MenuPageUp },
        { title: "", cmd: -1 },
    ]);

    assert.equal(fake.currentMenu(), null);
    assert.deepEqual(readDrawnMenu(fake).rows, [
        { kind: "heading", title: "ERAS" },
        { kind: "entry", title: "1970s", mark: null },
        { kind: "separator" },
        { kind: "entry", title: "1980s", mark: null },
    ]);
    assert.equal(highlightedEntry(fake), "1970s", "the cursor opens on the first entry, not the heading");
    press(fake, "Next");
    press(fake, "Next");
    assert.equal(highlightedEntry(fake), "1970s", "the heading is skipped when wrapping");
    press(fake, "Exit");
});

test("checked and radio entries carry a gold mark, a submenu entry a chevron, and the cursor opens on the selected item", () => {
    openMain([
        { title: "Play", cmd: COMMAND.PlayGame },
        { title: "In Favorites", cmd: COMMAND.AddFavorite, checked: true },
        { title: "Classic", cmd: 201, radio: true, selected: true },
        { title: "Filters", cmd: 202, hasSubmenu: true },
    ]);

    assert.deepEqual(readDrawnMenu(fake).rows, [
        { kind: "entry", title: "Play", mark: null },
        { kind: "entry", title: "In Favorites", mark: "check" },
        { kind: "entry", title: "Classic", mark: "radio" },
        { kind: "entry", title: "Filters", mark: "submenu" },
    ]);
    assert.equal(highlightedEntry(fake), "Classic");
    press(fake, "Exit");
});

test("a menu with nothing to choose stays native", () => {
    fake.openMenu("main", [{ title: "Nothing here", cmd: -1 }]);

    assert.equal(fake.currentMenu().id, "main");
    fake.closeMenu();
});
