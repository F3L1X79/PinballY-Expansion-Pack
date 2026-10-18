// ============================================================
// The Filter Picker as a Drawn Menu, through main.js on the fake PinballY
// globals: the main menu's entry carries the submenu arrow; the Filter
// Picker is drawn with the wheel selections, the groups and Back; Exit or
// Back in it goes back to the main menu, the cursor on its entry; Exit or
// Back in a group menu goes back to the Filter Picker, the cursor on that
// group.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { OPEN_OVER_MS, drawnMenuLines, readDrawnMenu, highlightedEntry, press, openMainMenu, chooseEntry } from "./drawn_menu_reader.js";

const ADD_ONS_UNDER_TEST = ["uiTranslation", "customMenuCommands", "menuCleanup", "drawnMenus"];
// Command id of a PinballY filter in the Era menu.
const ERA_1980S_CMD = 940;

const fake = createFakePinballYHost({ now: new Date(2026, 9, 15, 20, 0, 0) });
let LABELS;
let ENTRY;

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";
    const { default: lang } = await import("../../common/core/i18n.js");
    LABELS = lang.customMenuLabels;
    ENTRY = LABELS.changeFilter;
    await import("../../main.js");
    await settle();
    const COMMAND = globalThis.command;
    // What PinballY does itself on these commands; its group menus end
    // with a MenuReturn entry.
    fake.setNativeCommand(COMMAND.ShowMainMenu, () => fake.openMainMenu());
    fake.setNativeCommand(COMMAND.FilterByEra, () => fake.openMenu("filter by era", [
        { title: "1980s", cmd: ERA_1980S_CMD },
        { title: "", cmd: -1 },
        { title: "Back", cmd: COMMAND.MenuReturn },
    ]));
});

test("the main menu's Filter Picker entry carries the submenu arrow", () => {
    openMainMenu(fake);

    const row = readDrawnMenu(fake).rows.find(candidate => candidate.title === ENTRY);
    assert.equal(row.mark, "submenu");
    press(fake, "Exit");
});

test("the Filter Picker is drawn with the selections, the groups Menu Cleanup leaves, then Back", () => {
    openMainMenu(fake);
    chooseEntry(fake, ENTRY);
    fake.advanceTime(OPEN_OVER_MS);

    assert.equal(fake.currentMenu(), null, "no native menu");
    assert.deepEqual(drawnMenuLines(fake), [
        "All Tables", "Favorite Tables", "---",
        "Filter by Era", "Filter by Manufacturer", "Filter by Category", "Filter by Rating", "---", LABELS.filterPickerBack,
    ]);
    assert.equal(highlightedEntry(fake), "All Tables");
});

test("Exit in the Filter Picker goes back to the main menu, the cursor on its entry", () => {
    press(fake, "Exit");
    fake.advanceTime(OPEN_OVER_MS);

    assert.equal(drawnMenuLines(fake)[0], "Play");
    assert.equal(highlightedEntry(fake), ENTRY);
});

test("Back in the Filter Picker does the same", () => {
    chooseEntry(fake, ENTRY);
    fake.advanceTime(OPEN_OVER_MS);
    chooseEntry(fake, LABELS.filterPickerBack);
    fake.advanceTime(OPEN_OVER_MS);

    assert.equal(drawnMenuLines(fake)[0], "Play");
    assert.equal(highlightedEntry(fake), ENTRY);
});

test("Exit in a group menu goes back to the Filter Picker, the cursor on that group", () => {
    chooseEntry(fake, ENTRY);
    fake.advanceTime(OPEN_OVER_MS);
    chooseEntry(fake, "Filter by Era");
    fake.advanceTime(OPEN_OVER_MS);
    assert.equal(drawnMenuLines(fake)[0], "1980s");

    press(fake, "Exit");
    fake.advanceTime(OPEN_OVER_MS);
    assert.equal(drawnMenuLines(fake)[0], "All Tables", "the Filter Picker again");
    assert.equal(highlightedEntry(fake), "Filter by Era");
});

test("the group menu's Back entry does the same", () => {
    press(fake, "Next");
    chooseEntry(fake, "Filter by Manufacturer");
    // Only the Era menu is described: any group stands for the others.
    fake.openMenu("filter by manuf", [{ title: "Williams", cmd: 942 }, { title: "", cmd: -1 }, { title: "Back", cmd: globalThis.command.MenuReturn }]);
    fake.advanceTime(OPEN_OVER_MS);
    chooseEntry(fake, "Back");
    fake.advanceTime(OPEN_OVER_MS);

    assert.equal(drawnMenuLines(fake)[0], "All Tables", "the Filter Picker again");
    assert.equal(highlightedEntry(fake), "Filter by Manufacturer");
    press(fake, "Exit");
    fake.advanceTime(OPEN_OVER_MS);
    assert.equal(highlightedEntry(fake), ENTRY, "then the main menu, one level up");
    press(fake, "Exit");
    assertNoErrorLogged(fake);
});
