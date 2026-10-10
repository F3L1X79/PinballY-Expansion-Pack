// ============================================================
// The Admin Profile's menus, started through main.js on the fake PinballY
// globals: while no Profile is marked isAdmin in its profile.json, every
// Profile sees "Table Setup" in the main menu and "Operator Menu" in the
// Exit menu; once one is, only the Admin Profiles keep them, and the Exit
// menu keeps its other entries. A mark on Guest or a mark that is not a
// boolean is logged and ignored.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";

const NOW = new Date(2026, 8, 30, 20, 0, 0);
const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const profileFile = name => `${PROFILES}\\${name}\\profile.json`;
const markFile = (fake, name, isAdmin) => fake.addFile(profileFile(name), JSON.stringify({ version: 1, isAdmin }));

// PinballY's own separators are titled "".
const EXIT_MENU = ["Exit PinballY", "Shut Down", "", "Operator Menu", "", "Help", "About PinballY", "", "Cancel"];
const ADMIN_EXIT_MENU = ["Exit PinballY", "Shut Down", "", "Operator Menu", "Reset profile", "", "Help", "About PinballY", "", "Cancel"];
const EXIT_MENU_WITHOUT_OPERATOR_MENU = ["Exit PinballY", "Shut Down", "", "Help", "About PinballY", "", "Cancel"];

test("only the Admin Profiles keep the setup entries, once the household has one", async () => {
    const fake = createFakePinballYHost({ now: NOW });
    fake.addFolder(`${PROFILES}\\Alice`);
    fake.addFolder(`${PROFILES}\\Bob`);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = key === "customMenuCommands";
    }
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    const { getProfileStore } = await import("../../common/profile_store.js");
    const LABELS = lang.customMenuLabels;
    const TABLE_SETUP = LABELS.tableSetup;
    await import("../../main.js");
    const store = getProfileStore();

    const mainMenuTitles = () => {
        fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
        const titles = fake.currentMenu().items.map(item => item.title);
        fake.closeMenu();
        return titles;
    };
    const exitMenuTitles = () => {
        fake.openExitMenu();
        const titles = fake.currentMenu().items.map(item => item.title);
        fake.closeMenu();
        return titles;
    };

    store.switchTo("Alice");
    assert.ok(mainMenuTitles().includes(TABLE_SETUP), "no Admin Profile: everything shows");
    assert.deepEqual(exitMenuTitles(), EXIT_MENU);

    markFile(fake, "guest", true);
    markFile(fake, "Bob", "true");
    assert.ok(mainMenuTitles().includes(TABLE_SETUP), "a mark on Guest or not a boolean counts for nothing");
    assert.deepEqual(exitMenuTitles(), EXIT_MENU);
    assert.ok(fake.logLines().some(line => line.includes("Bob\\profile.json") && line.includes("isAdmin")));

    markFile(fake, "Bob", true);
    assert.deepEqual(mainMenuTitles(), ["Play", LABELS.tableOfTheDay, LABELS.tableOfTheWeek, LABELS.randomGame],
        "a non-admin loses Table Setup, the rest of the launch section stays");
    assert.deepEqual(exitMenuTitles(), EXIT_MENU_WITHOUT_OPERATOR_MENU, "and the Operator Menu, nothing else");

    store.switchTo("Bob");
    assert.ok(mainMenuTitles().includes(TABLE_SETUP), "an Admin Profile keeps both");
    assert.deepEqual(exitMenuTitles(), ADMIN_EXIT_MENU, "and gets Reset profile");

    store.switchTo("guest");
    assert.ok(!mainMenuTitles().includes(TABLE_SETUP), "Guest is never an Admin Profile");
    assert.deepEqual(exitMenuTitles(), EXIT_MENU_WITHOUT_OPERATOR_MENU);
    assert.ok(fake.logLines().some(line => line.includes("guest\\profile.json") && line.includes("isAdmin")));

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
