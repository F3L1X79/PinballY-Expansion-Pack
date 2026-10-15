// ============================================================
// The active filter's mark in the main menu and in "Filter Tables",
// through main.js on the fake PinballY globals with PinballY's native
// menus and Menu Cleanup off: a filter from a group (an Era) marks
// "Filter Tables" and that group alone in the submenu; a top-level filter
// keeps its own mark and leaves "Filter Tables" unmarked; a group PinballY
// marks itself is marked once.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const ADD_ONS_UNDER_TEST = ["uiTranslation", "customMenuCommands"];
// PinballY's own filter for the 1980s, in the Era group.
const ERA_1980S_FILTER = "YearRange.1980.1989";

const fake = createFakePinballYHost({ now: new Date(2026, 9, 15, 20, 0, 0) });
let lang;
let COMMAND;

const markedTitles = () => fake.currentMenu().items.filter(item => item.radio).map(item => item.title);

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";
    ({ default: lang } = await import("../../common/core/i18n.js"));
    await import("../../main.js");
    await settle();
    COMMAND = globalThis.command;
    fake.setNativeCommand(COMMAND.ShowMainMenu, () => fake.openMainMenu());
});

test("a top-level filter keeps its mark and Filter Tables has none", () => {
    fake.openMainMenu();

    assert.deepEqual(markedTitles(), ["All Tables"]);
    fake.closeMenu();
});

test("an Era filter marks Filter Tables in the main menu, and nothing else", () => {
    fake.setCurrentFilter(ERA_1980S_FILTER);
    fake.openMainMenu();

    assert.deepEqual(markedTitles(), [lang.customMenuLabels.filterTables]);
    fake.closeMenu();
});

test("in Filter Tables, only Filter by Era is marked", () => {
    fake.openMainMenu();
    fake.selectMenuItem(lang.customMenuLabels.filterTables);

    assert.deepEqual(markedTitles(), ["Filter by Era"]);
    fake.closeMenu();
});

test("a group PinballY marks itself is marked once", () => {
    const groups = [
        { title: "Filter by Era", cmd: COMMAND.FilterByEra, hasSubmenu: true, radio: true },
        { title: "Filter by Rating", cmd: COMMAND.FilterByRating, hasSubmenu: true },
    ];
    const mainMenu = () => fake.openMenu("main", [
        { title: "Play", cmd: COMMAND.PlayGame },
        ...groups,
        { title: "", cmd: -1 },
        { title: "Return", cmd: COMMAND.MenuReturn },
    ]);
    fake.setNativeCommand(COMMAND.ShowMainMenu, mainMenu);
    mainMenu();
    assert.deepEqual(markedTitles(), [lang.customMenuLabels.filterTables]);
    fake.selectMenuItem(lang.customMenuLabels.filterTables);

    assert.deepEqual(markedTitles(), ["Filter by Era"]);
    fake.closeMenu();
    assertNoErrorLogged(fake);
});
