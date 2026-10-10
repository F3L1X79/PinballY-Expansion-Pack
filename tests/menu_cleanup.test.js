// ============================================================
// Menu Cleanup, started through main.js on the fake PinballY globals: off
// by default, PinballY's native menus keep Help, About and the information
// entries; turned on, they are gone for every Profile, Admin Profiles
// included, from the Operator menu too, as are the filter submenus by
// system, last played and date added, the others set apart by a
// separator; Rate Table and Add to Favorites stay, the Operator Menu rules
// are unchanged, and no doubled, leading or trailing separator is left.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "./fake_pinbally_host.js";
import config from "../common/config.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const markAdmin = (fake, name) =>
    fake.addFile(`${PROFILES}\\${name}\\profile.json`, JSON.stringify({ version: 1, isAdmin: true }));

// Separators, titled "" (PinballY's) or untitled (the main menu module's), read "---".
const SEPARATOR = "---";
const CLEANED_NATIVE_MAIN_MENU = [SEPARATOR, "Rate Table", "Add to Favorites", SEPARATOR, "All Tables", "Favorites"];
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

    const { default: lang } = await import("../common/i18n.js");
    const { getProfileStore } = await import("../common/profile_store.js");
    const LABELS = lang.customMenuLabels;
    await import("../main.js");
    const store = getProfileStore();
    markAdmin(fake, "Bob");

    store.switchTo("Alice");
    assert.deepEqual(mainMenuTitles(), [
        "Play", LABELS.tableOfTheDay, LABELS.tableOfTheWeek, LABELS.randomGame, ...CLEANED_NATIVE_MAIN_MENU,
    ]);
    assert.deepEqual(exitMenuTitles(), CLEANED_EXIT_MENU_WITHOUT_OPERATOR_MENU);

    store.switchTo("Bob");
    assert.deepEqual(mainMenuTitles(), [
        "Play", LABELS.tableOfTheDay, LABELS.tableOfTheWeek, LABELS.randomGame, SEPARATOR, LABELS.tableSetup, ...CLEANED_NATIVE_MAIN_MENU,
    ]);
    assert.deepEqual(exitMenuTitles(), CLEANED_ADMIN_EXIT_MENU);

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});

test("no doubled, leading or trailing separator is left, titled or not", async () => {
    // Not an Admin Profile: no Reset profile entry at the end.
    const { getProfileStore } = await import("../common/profile_store.js");
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

test("the filter submenus by system, last played and date added are gone, the others stay", () => {
    const { PlayGame, FilterByEra, FilterByManufacturer, FilterBySystem, FilterByCategory, FilterByRating, FilterByRecency, FilterByAdded } = globalThis.command;
    fake.openMenu("main", [
        { title: "Play", cmd: PlayGame },
        { title: "", cmd: -1 },
        { title: "All Tables", cmd: 900 },
        { title: "Filter by Era", cmd: FilterByEra, hasSubmenu: true },
        { title: "Filter by Manufacturer", cmd: FilterByManufacturer, hasSubmenu: true },
        { title: "Filter by System", cmd: FilterBySystem, hasSubmenu: true },
        { title: "Filter by Category", cmd: FilterByCategory, hasSubmenu: true },
        { title: "Filter by Rating", cmd: FilterByRating, hasSubmenu: true },
        { title: "Filter by Last Played", cmd: FilterByRecency, hasSubmenu: true },
        { title: "Filter by Date Added", cmd: FilterByAdded, hasSubmenu: true },
    ]);
    const titles = fake.currentMenu().items.map(item => item.title);
    assert.deepEqual(titles.slice(-6), ["All Tables", undefined, "Filter by Era", "Filter by Manufacturer", "Filter by Category", "Filter by Rating"]);
    fake.closeMenu();
});

test("a separator sets the filter submenus apart from the filters, never doubled", () => {
    const { PlayGame, FilterBySystem, FilterByCategory } = globalThis.command;
    fake.openMenu("main", [
        { title: "Play", cmd: PlayGame },
        { title: "", cmd: -1 },
        { title: "All Tables", cmd: 900 },
        { title: "Filter by System", cmd: FilterBySystem, hasSubmenu: true },
        { title: "", cmd: -1 },
        { title: "Filter by Category", cmd: FilterByCategory, hasSubmenu: true },
    ]);
    assert.deepEqual(fake.currentMenu().items.map(item => (item.cmd === -1 ? SEPARATOR : item.title)).slice(-4),
        [SEPARATOR, "All Tables", SEPARATOR, "Filter by Category"]);
    fake.closeMenu();
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
