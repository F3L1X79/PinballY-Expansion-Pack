// ============================================================
// Hidden Tables, through main.js on the fake PinballY globals: the entry
// sits in the Filter Picker right under Favorites while at least one table is
// hidden, for a Profile with no mark as for an Admin Profile; choosing it
// puts the hidden tables on the wheel. Back on the wheel it runs again
// only when its tables changed (a table unhidden with "Hide this game"),
// and every table comes back once none is left.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { filterPickerSection } from "../support/main_menu_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const FILTER_ID = "User.project.HiddenTables";

const table = (id, isHidden) => ({ id, configId: `Table ${id}`, title: `Table ${id}`, manufacturer: "Williams", year: 1990, isHidden });
// Tables 1 to 5, the 2nd and 4th hidden.
const TABLES = [table(1, false), table(2, true), table(3, false), table(4, true), table(5, false)];

const fake = createFakePinballYHost({ now: new Date(2026, 9, 18, 20, 0, 0), tables: TABLES });
let lang;
let store;

const wheel = () => fake.getWheelTables().map(game => game.configId);
const hiddenTablesSection = () => filterPickerSection(fake, lang.customMenuLabels.hiddenTablesFilter);
// Chooses the filter, then the menu closes.
function chooseFilter() {
    fake.setCurrentFilter(FILTER_ID);
    fake.fire("wheelmode");
}
// Like "Hide this game" in the Game Setup menu, then back on the wheel.
function setHidden(configId, isHidden) {
    fake.getGameInfo(configId).update({ isHidden });
    fake.fire("wheelmode");
}

test("setup", async () => {
    fake.addFolder(`${PROFILES}\\Alice`);
    fake.addFile(`${PROFILES}\\Bob\\profile.json`, JSON.stringify({ version: 1, plays: {}, isAdmin: true }));
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "hiddenTables";
    config.language = "en";
    ({ default: lang } = await import("../../common/core/i18n.js"));
    const { getProfileStore } = await import("../../common/profiles/profile_store.js");
    await import("../../main.js");
    await settle();
    store = getProfileStore();
    store.switchTo("Alice");
});

test("with hidden tables, the entry is right under Favorites, for a Profile with no mark as for an Admin Profile", () => {
    assert.deepEqual(hiddenTablesSection(), ["All Tables", "Favorites", lang.customMenuLabels.hiddenTablesFilter]);

    store.switchTo("Bob");
    assert.deepEqual(hiddenTablesSection(), ["All Tables", "Favorites", lang.customMenuLabels.hiddenTablesFilter]);
    store.switchTo("Alice");
});

test("choosing it shows the hidden tables only", () => {
    chooseFilter();

    assert.equal(fake.currentFilterId(), FILTER_ID);
    assert.deepEqual(wheel(), ["Table 2", "Table 4"]);
});

test("back on the wheel with nothing changed, the wheel stays on its table", () => {
    fake.setWheelGame(1);
    assert.deepEqual(wheel(), ["Table 4", "Table 2"]);

    fake.fire("wheelmode");

    assert.deepEqual(wheel(), ["Table 4", "Table 2"]);
});

test("the current table unhidden leaves the selection on the return to the wheel", () => {
    setHidden("Table 4", false);

    assert.equal(fake.currentFilterId(), FILTER_ID);
    assert.deepEqual(wheel(), ["Table 2"]);
});

test("once no table is hidden, every table comes back and the entry is gone", () => {
    setHidden("Table 2", false);

    assert.equal(fake.currentFilterId(), "All");
    assert.deepEqual(wheel(), ["Table 2", "Table 3", "Table 4", "Table 5", "Table 1"], "still on the table just unhidden");
    assert.equal(hiddenTablesSection(), null);
});

test("a table hidden again brings the entry back", () => {
    setHidden("Table 5", true);

    assert.notEqual(hiddenTablesSection(), null);
    assertNoErrorLogged(fake);
});
