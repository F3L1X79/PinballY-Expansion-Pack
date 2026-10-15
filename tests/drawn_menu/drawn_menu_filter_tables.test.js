// ============================================================
// The "Filter Tables" submenu as a Drawn Menu, through main.js on the fake
// PinballY globals: the main menu's entry carries the submenu arrow; the
// submenu is drawn with the groups and Back; Exit or Back in it goes back
// to the main menu, the cursor on "Filter Tables"; Exit or Back in a group
// menu goes back to "Filter Tables", the cursor on that group.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { OPEN_OVER_MS, drawnMenuLines, readDrawnMenu, highlightedEntry, press, openMainMenu, chooseEntry } from "./drawn_menu_reader.js";

const ADD_ONS_UNDER_TEST = ["uiTranslation", "customMenuCommands", "menuCleanup", "drawnMenus"];
// Command ids of PinballY's own entries in the Era menu.
const ERA_1980S_CMD = 940;
const ERA_BACK_CMD = 941;

const fake = createFakePinballYHost({ now: new Date(2026, 9, 15, 20, 0, 0) });
let LABELS;

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";
    const { default: lang } = await import("../../common/core/i18n.js");
    LABELS = lang.customMenuLabels;
    await import("../../main.js");
    await settle();
    const COMMAND = globalThis.command;
    // What PinballY does itself on these commands.
    fake.setNativeCommand(COMMAND.ShowMainMenu, () => fake.openMainMenu());
    fake.setNativeCommand(COMMAND.FilterByEra, () => fake.openMenu("filter by era", [
        { title: "1980s", cmd: ERA_1980S_CMD },
        { title: "", cmd: -1 },
        { title: "Back", cmd: ERA_BACK_CMD },
    ]));
    fake.setNativeCommand(ERA_BACK_CMD, () => fake.openMainMenu());
});

test("the main menu's Filter Tables entry carries the submenu arrow", () => {
    openMainMenu(fake);

    const row = readDrawnMenu(fake).rows.find(candidate => candidate.title === LABELS.filterTables);
    assert.equal(row.mark, "submenu");
    press(fake, "Exit");
});

test("Filter Tables is drawn with the groups Menu Cleanup leaves, then Back", () => {
    openMainMenu(fake);
    chooseEntry(fake, LABELS.filterTables);
    fake.advanceTime(OPEN_OVER_MS);

    assert.equal(fake.currentMenu(), null, "no native menu");
    assert.deepEqual(drawnMenuLines(fake), [
        "Filter by Era", "Filter by Manufacturer", "Filter by Category", "Filter by Rating", "---", LABELS.filterTablesBack,
    ]);
    assert.equal(highlightedEntry(fake), "Filter by Era");
});

test("Exit in Filter Tables goes back to the main menu, the cursor on Filter Tables", () => {
    press(fake, "Exit");
    fake.advanceTime(OPEN_OVER_MS);

    assert.equal(drawnMenuLines(fake)[0], "Play");
    assert.equal(highlightedEntry(fake), LABELS.filterTables);
});

test("Back in Filter Tables does the same", () => {
    chooseEntry(fake, LABELS.filterTables);
    fake.advanceTime(OPEN_OVER_MS);
    chooseEntry(fake, LABELS.filterTablesBack);
    fake.advanceTime(OPEN_OVER_MS);

    assert.equal(drawnMenuLines(fake)[0], "Play");
    assert.equal(highlightedEntry(fake), LABELS.filterTables);
});

test("Exit in a group menu goes back to Filter Tables, the cursor on that group", () => {
    chooseEntry(fake, LABELS.filterTables);
    fake.advanceTime(OPEN_OVER_MS);
    chooseEntry(fake, "Filter by Era");
    fake.advanceTime(OPEN_OVER_MS);
    assert.equal(drawnMenuLines(fake)[0], "1980s");

    press(fake, "Exit");
    fake.advanceTime(OPEN_OVER_MS);
    assert.equal(drawnMenuLines(fake)[0], "Filter by Era");
    assert.equal(highlightedEntry(fake), "Filter by Era");
});

test("the group menu's Back entry does the same", () => {
    press(fake, "Next");
    chooseEntry(fake, "Filter by Manufacturer");
    // Only the Era menu is described: any group stands for the others.
    fake.openMenu("filter by manuf", [{ title: "Williams", cmd: 942 }, { title: "", cmd: -1 }, { title: "Back", cmd: ERA_BACK_CMD }]);
    fake.advanceTime(OPEN_OVER_MS);
    chooseEntry(fake, "Back");
    fake.advanceTime(OPEN_OVER_MS);

    assert.equal(drawnMenuLines(fake)[0], "Filter by Era");
    assert.equal(highlightedEntry(fake), "Filter by Manufacturer");
    press(fake, "Exit");
    fake.advanceTime(OPEN_OVER_MS);
    assert.equal(highlightedEntry(fake), LABELS.filterTables, "then the main menu, one level up");
    press(fake, "Exit");
    assertNoErrorLogged(fake);
});
