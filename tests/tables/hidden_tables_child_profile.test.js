// ============================================================
// Hidden Tables for a Child Profile, through main.js on the fake PinballY
// globals: the hidden Adult Tables stay out of its selection, and with
// only hidden Adult Tables the entry is absent for it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { mainMenuSection } from "../support/main_menu_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const FILTER_ID = "User.project.HiddenTables";

const table = (id, isHidden, categories = []) =>
    ({ id, configId: `Table ${id}`, title: `Table ${id}`, manufacturer: "Williams", year: 1990, isHidden, categories });
// Tables 1 to 4: the 2nd hidden, the 3rd a hidden Adult Table.
const TABLES = [table(1, false), table(2, true), table(3, true, ["NSFW"]), table(4, false)];

const fake = createFakePinballYHost({ now: new Date(2026, 9, 18, 20, 0, 0), tables: TABLES });
let lang;
let store;

const wheel = () => fake.getWheelTables().map(game => game.configId);
const hiddenTablesSection = () => mainMenuSection(fake, lang.customMenuLabels.hiddenTablesFilter);

test("setup", async () => {
    fake.addFolder(`${PROFILES}\\Alice`);
    fake.addFile(`${PROFILES}\\Kid\\profile.json`, JSON.stringify({ version: 1, plays: {}, isChild: true }));
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Kid" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "hiddenTables";
    config.language = "en";
    config.adultCategory = "NSFW";
    ({ default: lang } = await import("../../common/core/i18n.js"));
    const { getProfileStore } = await import("../../common/profiles/profile_store.js");
    await import("../../main.js");
    await settle();
    store = getProfileStore();
    store.switchTo("Kid");
});

test("a Child Profile does not see the hidden Adult Tables there", () => {
    fake.setCurrentFilter(FILTER_ID);
    fake.fire("wheelmode");

    assert.deepEqual(wheel(), ["Table 2"]);
});

test("another Profile sees them", () => {
    store.switchTo("Alice");
    fake.fire("wheelmode");

    assert.deepEqual(wheel(), ["Table 2", "Table 3"]);
});

test("with only hidden Adult Tables, the entry is absent for a Child Profile, present for the others", () => {
    fake.getGameInfo("Table 2").update({ isHidden: false });

    assert.notEqual(hiddenTablesSection(), null);
    store.switchTo("Kid");
    assert.equal(hiddenTablesSection(), null);
    assertNoErrorLogged(fake);
});
