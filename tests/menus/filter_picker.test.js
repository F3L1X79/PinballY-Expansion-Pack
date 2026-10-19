// ============================================================
// The Filter Picker through main.js with native menus: selections and groups
// leave the main menu for one entry naming the Active Filter; a selection
// applies at once, a group opens PinballY's group menu; Back and Exit go up
// one level, the cursor on the entry left.
// - PinballY's own Back in a group menu (MenuReturn) only closes it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { mainMenuSection } from "../support/main_menu_reader.js";

const ADD_ONS_UNDER_TEST = ["uiTranslation", "customMenuCommands", "hallOfFame", "tablesToDiscover"];
const SEPARATOR = "---";
const FILTER_BY_ERA = "filter by era";
// Command id of a PinballY filter in the Era menu, in the filter range.
const ERA_1980S_CMD = 940;
const ERA_1980S_FILTER = "YearRange.1980.1989";
const GROUPS = [
    "Filter by Era", "Filter by Manufacturer", "Filter by System", "Filter by Category",
    "Filter by Rating", "Filter by Last Played", "Filter by Date Added",
];

const fake = createFakePinballYHost({ now: new Date(2026, 9, 15, 20, 0, 0) });
let lang;
let COMMAND;
let appliedFilter = null;

const titlesOf = items => items.map(item => (item.cmd === -1 && !item.title ? SEPARATOR : item.title));
const currentTitles = () => titlesOf(fake.currentMenu().items);
const selectedTitle = () => fake.currentMenu().items.filter(item => item.selected).map(item => item.title);
const markedTitles = () => fake.currentMenu().items.filter(item => item.radio).map(item => item.title);
const entry = (name = "All Tables") => lang.customMenuLabels.activeFilter(name);
// Exit goes up one level at a time: pressed until no menu is left.
const closeMenus = () => { while (fake.currentMenu()) fake.pressExitInMenu(); };
const openFilterPicker = () => {
    fake.openMainMenu();
    fake.selectMenuItem(entry());
};

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";
    ({ default: lang } = await import("../../common/core/i18n.js"));
    await import("../../main.js");
    await settle();
    COMMAND = globalThis.command;
    // What PinballY does itself on these commands; its Era menu ends with
    // a MenuReturn entry, which only closes it.
    fake.setNativeCommand(COMMAND.ShowMainMenu, () => fake.openMainMenu());
    fake.setNativeCommand(COMMAND.FilterByEra, () => fake.openMenu(FILTER_BY_ERA, [
        { title: "1980s", cmd: ERA_1980S_CMD },
        { title: "", cmd: -1 },
        { title: "Back", cmd: COMMAND.MenuReturn },
    ]));
    fake.setNativeCommand(ERA_1980S_CMD, () => {
        appliedFilter = "1980s";
        fake.setCurrentFilter(ERA_1980S_FILTER);
        fake.fire("filterselect", {});
    });
});

test("the selections and the groups leave the main menu for one entry naming the Active Filter, with the arrow and no mark", () => {
    assert.deepEqual(mainMenuSection(fake, entry()), [entry(), "Return"]);

    fake.openMainMenu();
    const titles = currentTitles();
    assert.ok(!titles.some(title => title.startsWith("Filter by")), "no group line left");
    assert.ok(!titles.includes("All Tables") && !titles.includes("Favorite Tables"), "no selection left");
    const item = fake.currentMenu().items.find(candidate => candidate.title === entry());
    assert.equal(item.hasSubmenu, true);
    assert.deepEqual(markedTitles(), []);
    fake.closeMenu();
});

test("the Filter Picker lists the selections in PinballY's order, the current one marked, then the groups, then Back", () => {
    openFilterPicker();

    const { tablesToDiscoverFilter, hallOfFameFilter, filterPickerBack } = lang.customMenuLabels;
    assert.deepEqual(currentTitles(), [
        "All Tables", tablesToDiscoverFilter, hallOfFameFilter, "Favorite Tables", SEPARATOR,
        ...GROUPS, SEPARATOR,
        filterPickerBack,
    ]);
    assert.deepEqual(markedTitles(), ["All Tables"]);
    assert.ok(fake.currentMenu().items.filter(item => GROUPS.includes(item.title)).every(item => item.hasSubmenu));
    closeMenus();
});

test("choosing a selection applies it and closes the menus, and the entry then names it", () => {
    // What PinballY does itself on a filter's command.
    const hallOfFame = "User.project.HallOfFame";
    fake.setNativeCommand(globalThis.gameList.getFilterInfo(hallOfFame).cmd, () => fake.selectFilter(hallOfFame));
    openFilterPicker();
    fake.selectMenuItem(lang.customMenuLabels.hallOfFameFilter);

    assert.equal(fake.currentMenu(), null);
    assert.equal(fake.currentFilterId(), "User.project.HallOfFame");
    assert.deepEqual(mainMenuSection(fake, entry(lang.customMenuLabels.hallOfFameFilter)), [entry(lang.customMenuLabels.hallOfFameFilter), "Return"]);
    fake.setCurrentFilter("All");
});

test("a group opens PinballY's own group menu, where choosing a filter applies it and closes the menus", () => {
    openFilterPicker();
    fake.selectMenuItem("Filter by Era");

    assert.equal(fake.currentMenu().id, FILTER_BY_ERA);
    fake.selectMenuItem("1980s");
    assert.equal(appliedFilter, "1980s");
    assert.equal(fake.currentMenu(), null);
    fake.openMainMenu();
    assert.equal(fake.currentMenu().id, "main", "the next opening is the main menu again");
    fake.closeMenu();
});

test("with a group's filter on, the entry names it and the Filter Picker marks that group alone", () => {
    fake.openMainMenu();
    assert.ok(currentTitles().includes(entry("1980s Tables")), currentTitles().join(" | "));
    fake.selectMenuItem(entry("1980s Tables"));

    assert.deepEqual(markedTitles(), ["Filter by Era"]);
    closeMenus();
    fake.setCurrentFilter("All");
});

test("Back in the Filter Picker goes back to the main menu, the cursor on its entry", () => {
    openFilterPicker();
    fake.selectMenuItem(lang.customMenuLabels.filterPickerBack);

    assert.equal(fake.currentMenu().id, "main");
    assert.deepEqual(selectedTitle(), [entry()]);
    fake.closeMenu();
});

test("Back in a group menu goes back to the Filter Picker, the cursor on that group", () => {
    openFilterPicker();
    fake.selectMenuItem("Filter by Era");
    fake.selectMenuItem("Back");

    assert.equal(currentTitles()[0], "All Tables", "the Filter Picker again");
    assert.deepEqual(selectedTitle(), ["Filter by Era"]);
    closeMenus();
    fake.openMainMenu();
    assert.equal(fake.currentMenu().id, "main", "the next opening is the main menu again");
    fake.closeMenu();
});

test("Exit in the Filter Picker goes back to the main menu, the cursor on its entry", () => {
    openFilterPicker();
    fake.pressExitInMenu();

    assert.equal(fake.currentMenu().id, "main");
    assert.deepEqual(selectedTitle(), [entry()]);
    fake.pressExitInMenu();
    assert.equal(fake.currentMenu(), null, "Exit in the main menu closes it");
});

test("Exit in a group menu goes back to the Filter Picker, the cursor on that group, then to the main menu", () => {
    openFilterPicker();
    fake.selectMenuItem("Filter by Era");
    fake.pressExitInMenu();

    assert.equal(currentTitles()[0], "All Tables", "the Filter Picker again");
    assert.deepEqual(selectedTitle(), ["Filter by Era"]);
    fake.pressExitInMenu();
    assert.equal(fake.currentMenu().id, "main");
    assert.deepEqual(selectedTitle(), [entry()]);
    fake.pressExitInMenu();
});

test("attract mode closing the Filter Picker leaves the cabinet idle", () => {
    openFilterPicker();
    fake.enterAttractMode();

    assert.equal(fake.currentMenu(), null);
    fake.exitAttractMode();
});

test("with no group left the Filter Picker still opens with the selections; with neither the entry is gone", () => {
    const mainMenu = items => [
        { title: "Play", cmd: COMMAND.PlayGame },
        ...items,
        { title: "", cmd: -1 },
        { title: "Return", cmd: COMMAND.MenuReturn },
    ];
    const selections = [{ title: "All Tables", cmd: globalThis.gameList.getFilterInfo("All").cmd, radio: true }];
    fake.setNativeCommand(COMMAND.ShowMainMenu, () => fake.openMenu("main", mainMenu(selections)));
    fake.openMenu("main", mainMenu(selections));
    fake.selectMenuItem(entry());
    assert.deepEqual(currentTitles(), ["All Tables", SEPARATOR, lang.customMenuLabels.filterPickerBack]);
    closeMenus();

    fake.openMenu("main", mainMenu([]));
    assert.ok(!currentTitles().includes(entry()));
    fake.closeMenu();
    assertNoErrorLogged(fake);
});
