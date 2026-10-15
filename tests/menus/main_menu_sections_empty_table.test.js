// ============================================================
// The main menu with no selected-table entry shown, through main.js on the
// fake PinballY globals: Menu Cleanup on, no High Score Board, a non-Admin
// Profile once the household has an Admin, and PinballY offering neither
// Rate Table nor Add to Favorites (an empty wheel selection): the
// selected-table section is gone with its separator.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const ADD_ONS_UNDER_TEST = ["uiTranslation", "customMenuCommands", "menuCleanup", "profilePicker"];
const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const SEPARATOR = "---";

test("with no selected-table entry shown, the main menu has no selected-table section", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 30, 20, 0, 0) });
    fake.addFolder(`${PROFILES}\\Alice`);
    fake.addFile(`${PROFILES}\\Bob\\profile.json`, JSON.stringify({ version: 1, isAdmin: true }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";
    const { default: lang } = await import("../../common/core/i18n.js");
    const { getProfileStore } = await import("../../common/profiles/profile_store.js");
    await import("../../main.js");
    await settle();
    getProfileStore().switchTo("Alice");
    const LABELS = lang.customMenuLabels;
    const { PlayGame, GameInfo, Flyer, HighScores, Instructions, FilterFirst, FilterByEra, MenuReturn } = globalThis.command;

    fake.openMenu("main", [
        { title: "Play", cmd: PlayGame },
        { title: "", cmd: -1 },
        { title: "Information", cmd: GameInfo },
        { title: "Flyer", cmd: Flyer },
        { title: "High Scores", cmd: HighScores },
        { title: "Instruction Card", cmd: Instructions },
        { title: "", cmd: -1 },
        { title: "", cmd: -1 },
        { title: "All Tables", cmd: FilterFirst },
        { title: "", cmd: -1 },
        { title: "Filter by Era", cmd: FilterByEra, hasSubmenu: true },
        { title: "", cmd: -1 },
        { title: "Return", cmd: MenuReturn },
    ]);
    const titles = fake.currentMenu().items.map(item => (item.cmd === -1 && !item.title ? SEPARATOR : item.title));

    assert.deepEqual(titles, [
        "Play", LABELS.tableOfTheDay, LABELS.tableOfTheWeek, LABELS.randomGame, SEPARATOR,
        lang.profiles.menuEntry, SEPARATOR,
        "All Tables", SEPARATOR,
        LABELS.filterTables, SEPARATOR,
        "Return",
    ]);
    assertNoErrorLogged(fake);
});
