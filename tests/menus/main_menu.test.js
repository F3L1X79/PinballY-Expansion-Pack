// ============================================================
// Main menu module tests: entries added through its interface appear in
// PinballY's main menu right after "Play", grouped in sections (launch,
// then personal) split by separators, in their fixed position order
// whatever order the Add-ons added them in, and selecting one runs its
// action; reopening on an entry puts the cursor on it. Other menus are
// left alone.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import { createMainMenu, MAIN_MENU_POSITION } from "../../common/main_menu.js";

function setUp() {
    const fake = createFakePinballYHost();
    const mainMenu = createMainMenu(fake);
    const PLAY = { title: "Play", cmd: fake.getBuiltInCommand("PlayGame") };
    const openMainMenu = () => fake.openMenu("main", [PLAY, { title: "Exit", cmd: 99 }]);
    return { fake, mainMenu, openMainMenu };
}

const titles = menu => menu.items.map(item => item.title);
// A separator has no title.
const SEPARATOR = undefined;

test("entries sit right after Play, in their sections and position order, whatever order they were added in", () => {
    const { fake, mainMenu, openMainMenu } = setUp();
    mainMenu.add({ name: "stats", label: "Stats", position: MAIN_MENU_POSITION.PROFILE_STATS, action: () => {} });
    mainMenu.add({ name: "week", label: "Week", position: MAIN_MENU_POSITION.TABLE_OF_THE_WEEK, action: () => {} });
    mainMenu.add({ name: "player", label: "Player", position: MAIN_MENU_POSITION.PROFILE_PICKER, action: () => {} });
    mainMenu.add({ name: "random", label: "Random", position: MAIN_MENU_POSITION.RANDOM_GAME, action: () => {} });
    mainMenu.add({ name: "list", label: "List", position: MAIN_MENU_POSITION.ACHIEVEMENT_LIST, action: () => {} });
    mainMenu.add({ name: "day", label: "Day", position: MAIN_MENU_POSITION.TABLE_OF_THE_DAY, action: () => {} });
    mainMenu.add({ name: "setup", label: "Setup", position: MAIN_MENU_POSITION.TABLE_SETUP, action: () => {} });

    openMainMenu();

    assert.deepEqual(titles(fake.currentMenu()),
        ["Play", "Day", "Week", "Random", SEPARATOR, "Setup", SEPARATOR, "Player", "List", "Stats", SEPARATOR, "Exit"]);
    assert.ok(fake.currentMenu().items.filter(item => item.title === SEPARATOR).every(item => item.cmd === -1));
});

test("a section with no shown entry adds no separator", () => {
    const { fake, mainMenu, openMainMenu } = setUp();
    let setupShown = true;
    mainMenu.add({ name: "setup", label: "Setup", position: MAIN_MENU_POSITION.TABLE_SETUP, action: () => {}, shownWhen: () => setupShown });
    mainMenu.add({ name: "list", label: "List", position: MAIN_MENU_POSITION.ACHIEVEMENT_LIST, action: () => {} });

    openMainMenu();
    assert.deepEqual(titles(fake.currentMenu()), ["Play", "Setup", SEPARATOR, "List", SEPARATOR, "Exit"]);
    fake.closeMenu();

    setupShown = false;
    openMainMenu();
    assert.deepEqual(titles(fake.currentMenu()), ["Play", "List", SEPARATOR, "Exit"]);
});

test("no separator is doubled when a native separator already follows Play, nor added when nothing follows", () => {
    const { fake, mainMenu } = setUp();
    mainMenu.add({ name: "day", label: "Day", position: MAIN_MENU_POSITION.TABLE_OF_THE_DAY, action: () => {} });
    mainMenu.add({ name: "list", label: "List", position: MAIN_MENU_POSITION.ACHIEVEMENT_LIST, action: () => {} });
    const play = { title: "Play", cmd: fake.getBuiltInCommand("PlayGame") };

    fake.openMenu("main", [play, { cmd: -1 }, { title: "Rate", cmd: 97 }]);
    assert.deepEqual(titles(fake.currentMenu()), ["Play", "Day", SEPARATOR, "List", SEPARATOR, "Rate"]);
    fake.closeMenu();

    fake.openMenu("main", [play]);
    assert.deepEqual(titles(fake.currentMenu()), ["Play", "Day", SEPARATOR, "List"]);
});

test("the entries are added again each time the main menu opens, and only to the main menu", () => {
    const { fake, mainMenu, openMainMenu } = setUp();
    mainMenu.add({ name: "list", label: "List", position: MAIN_MENU_POSITION.ACHIEVEMENT_LIST, action: () => {} });

    fake.openMenu("exit", [{ title: "Quit", cmd: 98 }]);
    assert.deepEqual(titles(fake.currentMenu()), ["Quit"]);
    fake.closeMenu();

    openMainMenu();
    fake.closeMenu();
    openMainMenu();
    assert.deepEqual(titles(fake.currentMenu()), ["Play", "List", SEPARATOR, "Exit"]);
});

test("selecting an entry runs its action, and only its own", async () => {
    const { fake, mainMenu, openMainMenu } = setUp();
    const runs = [];
    mainMenu.add({ name: "list", label: "List", position: MAIN_MENU_POSITION.ACHIEVEMENT_LIST, action: () => runs.push("list") });
    mainMenu.add({ name: "random", label: "Random", position: MAIN_MENU_POSITION.RANDOM_GAME, action: async () => runs.push("random") });

    openMainMenu();
    fake.selectMenuItem("Random");
    await Promise.resolve();

    assert.deepEqual(runs, ["random"]);
});

test("an entry with a shown-when predicate appears only when it holds, checked on each opening", () => {
    const { fake, mainMenu, openMainMenu } = setUp();
    let shown = false;
    mainMenu.add({ name: "list", label: "List", position: MAIN_MENU_POSITION.ACHIEVEMENT_LIST, action: () => {} });
    mainMenu.add({ name: "week", label: "Week", position: MAIN_MENU_POSITION.TABLE_OF_THE_WEEK, action: () => {}, shownWhen: () => shown });

    openMainMenu();
    assert.deepEqual(titles(fake.currentMenu()), ["Play", "List", SEPARATOR, "Exit"]);
    fake.closeMenu();

    shown = true;
    openMainMenu();
    assert.deepEqual(titles(fake.currentMenu()), ["Play", "Week", SEPARATOR, "List", SEPARATOR, "Exit"]);
});

test("with every entry hidden by its predicate, the main menu is left as it is", () => {
    const { fake, mainMenu, openMainMenu } = setUp();
    mainMenu.add({ name: "week", label: "Week", position: MAIN_MENU_POSITION.TABLE_OF_THE_WEEK, action: () => {}, shownWhen: () => false });

    openMainMenu();

    assert.deepEqual(titles(fake.currentMenu()), ["Play", "Exit"]);
});

test("a failing shown-when predicate hides only its own entry", () => {
    const { fake, mainMenu, openMainMenu } = setUp();
    mainMenu.add({ name: "list", label: "List", position: MAIN_MENU_POSITION.ACHIEVEMENT_LIST, action: () => {} });
    mainMenu.add({ name: "week", label: "Week", position: MAIN_MENU_POSITION.TABLE_OF_THE_WEEK, action: () => {},
        shownWhen: () => { throw new Error("broken"); } });

    openMainMenu();

    assert.deepEqual(titles(fake.currentMenu()), ["Play", "List", SEPARATOR, "Exit"]);
});

test("reopening on an entry shows the main menu with the cursor on it, once", () => {
    const { fake, mainMenu, openMainMenu } = setUp();
    mainMenu.add({ name: "list", label: "List", position: MAIN_MENU_POSITION.ACHIEVEMENT_LIST, action: () => {} });
    mainMenu.add({ name: "stats", label: "Stats", position: MAIN_MENU_POSITION.PROFILE_STATS, action: () => {} });
    mainMenu.add({ name: "day", label: "Day", position: MAIN_MENU_POSITION.TABLE_OF_THE_DAY, action: () => {} });
    const selectedTitles = () => fake.currentMenu().items.filter(item => item.selected).map(item => item.title);

    mainMenu.reopenOn("stats");

    assert.equal(fake.executedCommands().at(-1), fake.getBuiltInCommand("ShowMainMenu"));
    openMainMenu();
    assert.deepEqual(selectedTitles(), ["Stats"]);
    fake.closeMenu();
    openMainMenu();
    assert.deepEqual(selectedTitles(), [], "the next opening starts as usual");
});
