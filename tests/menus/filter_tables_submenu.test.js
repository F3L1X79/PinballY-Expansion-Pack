// ============================================================
// The "Filter Tables" submenu, through main.js on the fake PinballY
// globals with PinballY's native menus and Menu Cleanup off: the filter
// groups leave the main menu for one "Filter Tables" entry with the
// submenu arrow, above Return; it lists every group in PinballY's order;
// a group opens PinballY's own group menu, a filter value applies there;
// Back goes up one level at a time, the cursor on the entry left; with
// no group the entry is gone, with one the submenu stays.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const ADD_ONS_UNDER_TEST = ["uiTranslation", "customMenuCommands"];
const SEPARATOR = "---";
const FILTER_BY_ERA = "filter by era";
// Command ids of PinballY's own entries in the Era menu, in the filter range.
const ERA_1980S_CMD = 940;
const ERA_BACK_CMD = 941;

const fake = createFakePinballYHost({ now: new Date(2026, 9, 15, 20, 0, 0) });
let lang;
let COMMAND;
let appliedFilter = null;

const titlesOf = items => items.map(item => (item.cmd === -1 && !item.title ? SEPARATOR : item.title));
const currentTitles = () => titlesOf(fake.currentMenu().items);
const selectedTitle = () => fake.currentMenu().items.filter(item => item.selected).map(item => item.title);

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";
    ({ default: lang } = await import("../../common/core/i18n.js"));
    await import("../../main.js");
    await settle();
    COMMAND = globalThis.command;
    // What PinballY does itself on these commands; its Era menu's Back
    // entry opens the main menu again.
    fake.setNativeCommand(COMMAND.ShowMainMenu, () => fake.openMainMenu());
    fake.setNativeCommand(COMMAND.FilterByEra, () => fake.openMenu(FILTER_BY_ERA, [
        { title: "1980s", cmd: ERA_1980S_CMD },
        { title: "", cmd: -1 },
        { title: "Back", cmd: ERA_BACK_CMD },
    ]));
    fake.setNativeCommand(ERA_1980S_CMD, () => {
        appliedFilter = "1980s";
        fake.fire("filterselect", {});
    });
    fake.setNativeCommand(ERA_BACK_CMD, () => fake.openMainMenu());
});

test("the filter groups leave the main menu for one Filter Tables entry with the arrow, above Return", () => {
    fake.openMainMenu();
    const items = fake.currentMenu().items;

    assert.deepEqual(currentTitles().slice(-5), ["Favorite Tables", SEPARATOR, lang.customMenuLabels.filterTables, SEPARATOR, "Return"]);
    assert.ok(!currentTitles().some(title => title.startsWith("Filter by")), "no group line left");
    assert.equal(items.find(item => item.title === lang.customMenuLabels.filterTables).hasSubmenu, true);
    fake.closeMenu();
});

test("Filter Tables lists every group PinballY shows, in its order, then Back", () => {
    fake.openMainMenu();
    fake.selectMenuItem(lang.customMenuLabels.filterTables);

    assert.deepEqual(currentTitles(), [
        "Filter by Era", "Filter by Manufacturer", "Filter by System", "Filter by Category",
        "Filter by Rating", "Filter by Last Played", "Filter by Date Added", SEPARATOR,
        lang.customMenuLabels.filterTablesBack,
    ]);
    assert.ok(fake.currentMenu().items.filter(item => String(item.title).startsWith("Filter by")).every(item => item.hasSubmenu));
    fake.closeMenu();
});

test("a group opens PinballY's own group menu, where choosing a filter applies it and closes the menus", () => {
    fake.openMainMenu();
    fake.selectMenuItem(lang.customMenuLabels.filterTables);
    fake.selectMenuItem("Filter by Era");

    assert.equal(fake.currentMenu().id, FILTER_BY_ERA);
    fake.selectMenuItem("1980s");
    assert.equal(appliedFilter, "1980s");
    assert.equal(fake.currentMenu(), null);
    fake.openMainMenu();
    assert.equal(fake.currentMenu().id, "main", "the next opening is the main menu again");
    fake.closeMenu();
});

test("Back in Filter Tables goes back to the main menu, the cursor on Filter Tables", () => {
    fake.openMainMenu();
    fake.selectMenuItem(lang.customMenuLabels.filterTables);
    fake.selectMenuItem(lang.customMenuLabels.filterTablesBack);

    assert.equal(fake.currentMenu().id, "main");
    assert.deepEqual(selectedTitle(), [lang.customMenuLabels.filterTables]);
    fake.closeMenu();
});

test("Back in a group menu goes back to Filter Tables, the cursor on that group", () => {
    fake.openMainMenu();
    fake.selectMenuItem(lang.customMenuLabels.filterTables);
    fake.selectMenuItem("Filter by Era");
    fake.selectMenuItem("Back");

    assert.equal(currentTitles()[0], "Filter by Era", "Filter Tables again");
    assert.deepEqual(selectedTitle(), ["Filter by Era"]);
    fake.closeMenu();
    fake.openMainMenu();
    assert.equal(fake.currentMenu().id, "main", "the next opening is the main menu again");
    fake.closeMenu();
});

test("closing a group menu leaves the next opening to the main menu", () => {
    fake.openMainMenu();
    fake.selectMenuItem(lang.customMenuLabels.filterTables);
    fake.selectMenuItem("Filter by Era");
    fake.closeMenu();

    fake.openMainMenu();
    assert.equal(fake.currentMenu().id, "main");
    fake.closeMenu();
});

test("with a single group the submenu stays; with none the entry is gone", () => {
    const mainMenu = groups => [
        { title: "Play", cmd: COMMAND.PlayGame },
        ...groups,
        { title: "", cmd: -1 },
        { title: "Return", cmd: COMMAND.MenuReturn },
    ];
    fake.setNativeCommand(COMMAND.ShowMainMenu, () => fake.openMenu("main", mainMenu([{ title: "Filter by Rating", cmd: COMMAND.FilterByRating, hasSubmenu: true }])));
    fake.openMenu("main", mainMenu([{ title: "Filter by Rating", cmd: COMMAND.FilterByRating, hasSubmenu: true }]));
    fake.selectMenuItem(lang.customMenuLabels.filterTables);
    assert.deepEqual(currentTitles(), ["Filter by Rating", SEPARATOR, lang.customMenuLabels.filterTablesBack]);
    fake.closeMenu();

    fake.openMenu("main", mainMenu([]));
    assert.ok(!currentTitles().includes(lang.customMenuLabels.filterTables));
    fake.closeMenu();
    assertNoErrorLogged(fake);
});
