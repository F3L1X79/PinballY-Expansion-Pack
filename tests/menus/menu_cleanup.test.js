// ============================================================
// Menu Cleanup, started through main.js on the fake PinballY globals: off
// by default, PinballY's native menus keep Help, About and the information
// entries; turned on, they are gone for every Profile, Admin Profiles
// included, from the Operator menu too, as are the filter submenus by
// system, last played and date added, which stay out of "Filter Tables";
// Rate Table and Add to Favorites stay, the Operator Menu rules
// are unchanged, and no doubled, leading or trailing separator is left.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const markAdmin = (fake, name) =>
    fake.addFile(`${PROFILES}\\${name}\\profile.json`, JSON.stringify({ version: 1, isAdmin: true }));

// Separators, titled "" (PinballY's) or untitled (the main menu module's), read "---".
const SEPARATOR = "---";
const FILTER_TABLES = "Filter Tables";
const CLEANED_TABLE_LISTS_AND_FILTERS = [SEPARATOR, "All Tables", "Favorites", SEPARATOR, FILTER_TABLES, SEPARATOR, "Return"];
const CLEANED_ADMIN_EXIT_MENU = ["Exit PinballY", "Shut Down", SEPARATOR, "Operator Menu", "Reset profile", SEPARATOR, "Cancel"];
const CLEANED_EXIT_MENU_WITHOUT_OPERATOR_MENU = ["Exit PinballY", "Shut Down", SEPARATOR, "Cancel"];

const fake = createFakePinballYHost({ now: new Date(2026, 8, 30, 20, 0, 0) });

function titlesOf(open) {
    open();
    const titles = fake.currentMenu().items.map(item => (item.cmd === -1 ? SEPARATOR : item.title));
    fake.closeMenu();
    return titles;
}
const mainMenuTitles = () => titlesOf(() => fake.openMainMenu());
const exitMenuTitles = () => titlesOf(() => fake.openExitMenu());

test("Menu Cleanup is the only Add-on off by default", () => {
    const offByDefault = Object.entries(config.addOns).filter(([, isOn]) => !isOn).map(([key]) => key);
    assert.deepEqual(offByDefault, ["menuCleanup"]);
});

test("turned on, Menu Cleanup lightens the menus for every Profile, Admin included", async () => {
    fake.addFolder(`${PROFILES}\\Alice`);
    fake.addFolder(`${PROFILES}\\Bob`);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = key === "customMenuCommands" || key === "menuCleanup";
    }
    config.language = "en";

    const { default: lang } = await import("../../common/core/i18n.js");
    const { getProfileStore } = await import("../../common/profiles/profile_store.js");
    const LABELS = lang.customMenuLabels;
    await import("../../main.js");
    const store = getProfileStore();
    markAdmin(fake, "Bob");

    store.switchTo("Alice");
    assert.deepEqual(mainMenuTitles(), [
        "Play", LABELS.tableOfTheDay, LABELS.tableOfTheWeek, LABELS.randomGame, SEPARATOR,
        "Rate Table", "Add to Favorites", ...CLEANED_TABLE_LISTS_AND_FILTERS,
    ]);
    assert.deepEqual(exitMenuTitles(), CLEANED_EXIT_MENU_WITHOUT_OPERATOR_MENU);

    store.switchTo("Bob");
    assert.deepEqual(mainMenuTitles(), [
        "Play", LABELS.tableOfTheDay, LABELS.tableOfTheWeek, LABELS.randomGame, SEPARATOR,
        "Rate Table", "Add to Favorites", LABELS.tableSetup, ...CLEANED_TABLE_LISTS_AND_FILTERS,
    ]);
    assert.deepEqual(exitMenuTitles(), CLEANED_ADMIN_EXIT_MENU);

    assertNoErrorLogged(fake);
});

test("no doubled, leading or trailing separator is left, titled or not", async () => {
    // Not an Admin Profile: no Reset profile entry at the end.
    const { getProfileStore } = await import("../../common/profiles/profile_store.js");
    getProfileStore().switchTo("Alice");
    const { Help, AboutBox, Quit } = globalThis.command;
    fake.openMenu("exit", [
        { title: "Help", cmd: Help },
        { title: "", cmd: -1 },
        { cmd: -1 },
        { title: "Exit PinballY", cmd: Quit },
        { cmd: -1 },
        { title: "", cmd: -1 },
        { title: "About PinballY", cmd: AboutBox },
    ]);
    assert.deepEqual(fake.currentMenu().items.map(item => item.title), ["Exit PinballY"]);
    fake.closeMenu();
});

test("the filter submenus by system, last played and date added stay out of Filter Tables, the others are there", () => {
    fake.setNativeCommand(globalThis.command.ShowMainMenu, () => fake.openMainMenu());
    fake.openMainMenu();
    fake.selectMenuItem(FILTER_TABLES);

    assert.deepEqual(fake.currentMenu().items.map(item => (item.cmd === -1 ? SEPARATOR : item.title)), [
        "Filter by Era", "Filter by Manufacturer", "Filter by Category", "Filter by Rating", SEPARATOR, "Back",
    ]);
    fake.closeMenu();
    assertNoErrorLogged(fake);
});

test("Help and About leave the Operator menu too", () => {
    const { ShowGameSetupMenu, Help, AboutBox, MenuReturn } = globalThis.command;
    fake.openMenu("operator", [
        { title: "Game Setup", cmd: ShowGameSetupMenu },
        { title: "", cmd: -1 },
        { title: "Help", cmd: Help },
        { title: "About PinballY", cmd: AboutBox },
        { title: "", cmd: -1 },
        { title: "Cancel", cmd: MenuReturn },
    ]);
    assert.deepEqual(fake.currentMenu().items.map(item => (item.cmd === -1 ? SEPARATOR : item.title)),
        ["Game Setup", SEPARATOR, "Cancel"]);
    fake.closeMenu();
});
