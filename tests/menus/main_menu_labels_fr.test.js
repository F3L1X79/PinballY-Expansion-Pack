// ============================================================
// The main menu in French, through main.js on the fake PinballY globals:
// the Achievement List and Profile Stats entries read "Voir vos succès" and
// "Vos statistiques", PinballY's Favorites filter reads "Tables favorites",
// the screens keep their own titles, and the Tables to Discover filter
// reads "Tables à découvrir".
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";

const ADD_ONS_UNDER_TEST = ["uiTranslation", "customMenuCommands", "achievements", "tablesToDiscover"];
// Any command id: only the title is translated.
const FAVORITES_FILTER_CMD = 7000;

test("the main menu names the Achievements, the Stats and the Favorite Tables in French", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 30, 20, 0, 0), tables: [] });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "fr";

    const { default: lang } = await import("../../common/i18n.js");
    await import("../../main.js");
    await settle();

    fake.openMenu("main", [
        { title: "Play", cmd: globalThis.command.PlayGame },
        { cmd: -1 },
        { title: "Favorites", cmd: FAVORITES_FILTER_CMD },
    ]);
    const titles = fake.currentMenu().items.map(item => item.title);

    for (const label of ["Voir vos succès", "Vos statistiques", "Tables favorites"]) {
        assert.ok(titles.includes(label), `${label} in ${titles.join(" | ")}`);
    }
    assert.equal(lang.achievementList.title, "Succès personnels");
    assert.equal(lang.profileStats.buttons.mostPlayedTables, "Tables les plus jouées");
    const tablesToDiscover = fake.scriptFilters().find(filter => filter.id === "project.TablesToDiscover");
    assert.equal(tablesToDiscover.title, "Tables à découvrir");
});
