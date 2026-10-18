// ============================================================
// The Active Filter in the main menu and in the Filter Picker, through
// main.js on the fake PinballY globals with PinballY's native menus and
// Menu Cleanup off: the main menu marks nothing and its entry names the
// Active Filter as the menus show it; in the Filter Picker a top-level
// filter keeps PinballY's mark, a filter from a group (an Era) marks that
// group alone, and a group PinballY marks itself is marked once.
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
const entryTitle = () => fake.currentMenu().items.find(item => item.cmd === fake.commandId("filterPicker")).title;

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

test("with a top-level filter, the main menu marks nothing and the Filter Picker keeps PinballY's mark", () => {
    fake.openMainMenu();
    assert.deepEqual(markedTitles(), []);
    assert.equal(entryTitle(), "Active filter: All Tables");

    fake.selectMenuItem(entryTitle());
    assert.deepEqual(markedTitles(), ["All Tables"]);
    fake.closeMenu();
    fake.closeMenu();
});

test("with an Era filter, the main menu still marks nothing and the Filter Picker marks Filter by Era alone", () => {
    fake.setCurrentFilter(ERA_1980S_FILTER);
    fake.openMainMenu();
    assert.deepEqual(markedTitles(), []);
    assert.equal(entryTitle(), "Active filter: 1980s Tables");

    fake.selectMenuItem(entryTitle());
    assert.deepEqual(markedTitles(), ["Filter by Era"]);
    fake.closeMenu();
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
    assert.deepEqual(markedTitles(), []);
    fake.selectMenuItem(lang.customMenuLabels.activeFilter("1980s Tables"));

    assert.deepEqual(markedTitles(), ["Filter by Era"]);
    fake.closeMenu();
    fake.closeMenu();
    assertNoErrorLogged(fake);
});
