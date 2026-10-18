// ============================================================
// The Filter Picker as a Drawn Menu, through main.js on the fake PinballY
// globals, with the Challenges Add-on: the Drawn Menu lists exactly the
// entries of the Filter Picker the pack built, so the Challenge Tables
// entry is there while the active Profile's Challenge has Challenge
// Tables and left out once none is left.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { OPEN_OVER_MS, drawnMenuLines, openMainMenu, chooseEntry } from "./drawn_menu_reader.js";
import { sectionHolding } from "../support/main_menu_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const ADD_ONS_UNDER_TEST = ["uiTranslation", "customMenuCommands", "profilePicker", "challenges", "drawnMenus"];
const FAVORITE_TABLES = "Favorite Tables";
const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const TABLES = [
    { id: 1, configId: "Medieval Madness", title: "Medieval Madness", manufacturer: "Williams", year: 1997 },
    { id: 2, configId: "Elvira", title: "Elvira", manufacturer: "Bally", year: 1989 },
];

const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 10, 0, 0), tables: TABLES });
let challengeTables;
let filterPickerEntry;
// The Filter Picker's lines as the pack handed them to the Drawn Menus, at its last opening.
let builtLines = null;

test("setup", async () => {
    fake.addFolder(`${PROFILES}\\Alice`);
    // Alice follows a decade Challenge, with Medieval Madness alone to play.
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({
        challenge: { firstWeek: "2026-09-21", week: "2026-09-21", games: [], completed: false, completedCount: 0, judgedWeek: "", history: [] },
    }));
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({
        version: 1,
        activeProfile: "Alice",
        challenge: { current: { week: "2026-09-21", template: "decadeTables", param: 1990, target: 2 }, previous: null },
    }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";
    const { default: lang } = await import("../../common/core/i18n.js");
    challengeTables = lang.customMenuLabels.challengeTables;
    filterPickerEntry = lang.customMenuLabels.activeFilter("All Tables");
    await import("../../main.js");
    await settle();
    // Registered after every Add-on, so it reads the entries they built.
    fake.on("menuopen", ev => {
        if (ev.id === "filter picker") builtLines = ev.items.map(item => (item.cmd === -1 ? "---" : item.title));
    });
});

// PinballY opens the main menu on ShowMainMenu, which the Filter Picker
// runs to show itself.
function drawnFilterPicker() {
    fake.setNativeCommand(globalThis.command.ShowMainMenu, () => fake.openMainMenu());
    openMainMenu(fake);
    chooseEntry(fake, filterPickerEntry);
    fake.advanceTime(OPEN_OVER_MS);
    const lines = drawnMenuLines(fake);
    // Exit goes back to the main menu, then closes it.
    for (let count = 0; count < 2; count++) {
        fake.fire("commandbuttondown", { command: "Exit", repeat: false });
        fake.advanceTime(OPEN_OVER_MS);
    }
    return lines;
}

test("with Challenge Tables, the Drawn Menu shows the entry under All Tables, as the pack built it", () => {
    const lines = drawnFilterPicker();

    assert.deepEqual(sectionHolding(lines, challengeTables), ["All Tables", challengeTables, FAVORITE_TABLES]);
    assert.deepEqual(lines, builtLines);
});

test("once no Challenge Table is left, the Drawn Menu leaves the entry out too", () => {
    fake.gameStarted(TABLES[0]);
    fake.advanceTime(90 * 1000);
    fake.gameOver(TABLES[0]);
    fake.fire("wheelmode");

    const lines = drawnFilterPicker();

    assert.equal(lines.indexOf(challengeTables), -1);
    assert.deepEqual(sectionHolding(lines, "All Tables"), ["All Tables", FAVORITE_TABLES]);
    assert.deepEqual(lines, builtLines);
    assertNoErrorLogged(fake);
});
