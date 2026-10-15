// ============================================================
// The main menu's sections, through main.js on the fake PinballY globals,
// Menu Cleanup off: Play and the launches, the player, the selected table
// (High Score Board, PinballY's table entries, Rate Table, Add to
// Favorites, Table Setup last for an Admin Profile only), the table lists,
// "Filter Tables", any entry the pack does not know, then Return; a
// section with no entry shown goes with its separator.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const ADD_ONS_UNDER_TEST = [
    "uiTranslation", "customMenuCommands", "profilePicker", "achievements", "highScores",
    "hallOfFame", "tablesToDiscover", "challenges",
];
const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const SEPARATOR = "---";
// Any command the pack does not know.
const OTHER_SCRIPT_CMD = 3000;

const fake = createFakePinballYHost({ now: new Date(2026, 8, 30, 20, 0, 0) });
let lang;
let store;

const titlesOf = items => items.map(item => (item.cmd === -1 && !item.title ? SEPARATOR : item.title));
function mainMenuTitles(open = () => fake.openMainMenu()) {
    open();
    const titles = titlesOf(fake.currentMenu().items);
    fake.closeMenu();
    return titles;
}

test("setup", async () => {
    fake.addFolder(`${PROFILES}\\Alice`);
    fake.addFolder(`${PROFILES}\\Bob`);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";
    ({ default: lang } = await import("../../common/core/i18n.js"));
    const { getProfileStore } = await import("../../common/profiles/profile_store.js");
    await import("../../main.js");
    await settle();
    store = getProfileStore();
    store.switchTo("Alice");
});

const launches = () => ["Play", lang.customMenuLabels.tableOfTheDay, lang.customMenuLabels.tableOfTheWeek, lang.customMenuLabels.randomGame];
const player = () => [lang.profiles.menuEntry, lang.achievementList.menuEntry, lang.profileStats.menuEntry];
const tableLists = () => {
    const { challengeTables, tablesToDiscoverFilter, hallOfFameFilter } = lang.customMenuLabels;
    return ["All Tables", challengeTables, tablesToDiscoverFilter, hallOfFameFilter, "Favorite Tables"];
};

test("the main menu runs launches, player, selected table, table lists, Filter Tables, then Return", () => {
    assert.deepEqual(mainMenuTitles(), [
        ...launches(), SEPARATOR,
        ...player(), SEPARATOR,
        lang.highScores.board.menuEntry, "Information", "Flyer", "Instruction Card", "Rate Table", "Add to Favorites",
        lang.customMenuLabels.tableSetup, SEPARATOR,
        ...tableLists(), SEPARATOR,
        lang.customMenuLabels.filterTables, SEPARATOR,
        "Return",
    ]);
});

test("once the household has an Admin Profile, Table Setup is the selected table's last line for it only", () => {
    fake.addFile(`${PROFILES}\\Bob\\profile.json`, JSON.stringify({ version: 1, isAdmin: true }));
    const selectedTable = titles => titles.slice(titles.indexOf(lang.highScores.board.menuEntry), titles.indexOf("All Tables"));

    assert.deepEqual(selectedTable(mainMenuTitles()),
        [lang.highScores.board.menuEntry, "Information", "Flyer", "Instruction Card", "Rate Table", "Add to Favorites", SEPARATOR]);
    store.switchTo("Bob");
    assert.deepEqual(selectedTable(mainMenuTitles()),
        [lang.highScores.board.menuEntry, "Information", "Flyer", "Instruction Card", "Rate Table", "Add to Favorites",
            lang.customMenuLabels.tableSetup, SEPARATOR]);
    store.switchTo("Alice");
});

test("PinballY's table entries keep its order wherever it lists them, Remove from Favorites included", () => {
    const { PlayGame, GameInfo, Flyer, Instructions, RateGame, RemoveFavorite, MenuReturn } = globalThis.command;
    const titles = mainMenuTitles(() => fake.openMenu("main", [
        { title: "Play", cmd: PlayGame },
        { title: "Remove from Favorites", cmd: RemoveFavorite },
        { title: "Rate Table", cmd: RateGame },
        { title: "", cmd: -1 },
        { title: "Instruction Card", cmd: Instructions },
        { title: "Flyer", cmd: Flyer },
        { title: "Information", cmd: GameInfo },
        { title: "Return", cmd: MenuReturn },
    ]));
    assert.deepEqual(titles.slice(titles.indexOf(lang.highScores.board.menuEntry), titles.indexOf("Return")),
        [lang.highScores.board.menuEntry, "Information", "Flyer", "Instruction Card", "Rate Table", "Remove from Favorites", SEPARATOR]);
});

test("entries the pack does not know keep their order in their own section, just above Return", () => {
    const { PlayGame, Quit, FilterByEra, MenuReturn } = globalThis.command;
    const titles = mainMenuTitles(() => fake.openMenu("main", [
        { title: "Play", cmd: PlayGame },
        { title: "Quit PinballY", cmd: Quit },
        { title: "", cmd: -1 },
        { title: "Filter by Era", cmd: FilterByEra, hasSubmenu: true },
        { title: "Another script's entry", cmd: OTHER_SCRIPT_CMD },
        { title: "Return", cmd: MenuReturn },
    ]));
    assert.deepEqual(titles.slice(titles.indexOf(lang.customMenuLabels.filterTables)),
        [lang.customMenuLabels.filterTables, SEPARATOR, "Quit PinballY", "Another script's entry", SEPARATOR, "Return"]);
});

test("no section leaves a doubled, leading or trailing separator when PinballY lists nothing but Play", () => {
    const titles = mainMenuTitles(() => fake.openMenu("main", [
        { title: "", cmd: -1 },
        { title: "Play", cmd: globalThis.command.PlayGame },
        { title: "", cmd: -1 },
        { title: "", cmd: -1 },
    ]));
    assert.deepEqual(titles, [
        ...launches(), SEPARATOR, ...player(), SEPARATOR, lang.highScores.board.menuEntry,
    ]);
    assertNoErrorLogged(fake);
});
