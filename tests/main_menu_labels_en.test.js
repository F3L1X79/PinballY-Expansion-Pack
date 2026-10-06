// ============================================================
// The main menu in English, through main.js on the fake PinballY globals:
// the Achievement List and Profile Stats entries read "Your Achievements" and
// "Your Stats", PinballY's Favorites filter reads "Favorite Tables",
// and the screens keep their own titles. Among the [Top] filters, the
// Tables to Discover and the Hall of Fame sit, in that order, after the
// Challenge Tables and before the Favorite Tables.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";

const ADD_ONS_UNDER_TEST = ["uiTranslation", "customMenuCommands", "achievements", "hallOfFame", "tablesToDiscover", "challenges"];
// Any command id: only the title is translated.
const FAVORITES_FILTER_CMD = 7000;
// PinballY's "All Tables" has sort key "3000" and "Favorites" "7000" in the [Top] group.
const ALL_TABLES_SORT_KEY = "3000";
const FAVORITES_SORT_KEY = "7000";

const fake = createFakePinballYHost({ now: new Date(2026, 8, 30, 20, 0, 0), tables: [] });

test("the main menu names the Achievements, the Stats and the Favorite Tables in English", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";

    const { default: lang } = await import("../common/i18n.js");
    await import("../main.js");
    await settle();

    fake.openMenu("main", [
        { title: "Play", cmd: globalThis.command.PlayGame },
        { cmd: -1 },
        { title: "Favorites", cmd: FAVORITES_FILTER_CMD },
    ]);
    const titles = fake.currentMenu().items.map(item => item.title);

    for (const label of ["Your Achievements", "Your Stats", "Favorite Tables"]) {
        assert.ok(titles.includes(label), `${label} in ${titles.join(" | ")}`);
    }
    assert.equal(lang.achievementList.title, "Achievement List");
    assert.equal(lang.profileStats.title("Léa"), "Léa's stats");
});

test("the [Top] filters run All Tables, Challenge Tables, Tables to Discover, the Hall of Fame, then Favorite Tables", () => {
    const sortKeyOf = id => fake.scriptFilters().find(filter => filter.id === id).sortKey;
    const challengeTables = sortKeyOf("project.ChallengeTables");
    const tablesToDiscover = sortKeyOf("project.TablesToDiscover");
    const hallOfFame = sortKeyOf("project.HallOfFame");

    assert.ok(ALL_TABLES_SORT_KEY < challengeTables, challengeTables);
    assert.ok(challengeTables < tablesToDiscover && tablesToDiscover < hallOfFame, tablesToDiscover);
    assert.ok(hallOfFame < FAVORITES_SORT_KEY, hallOfFame);
});
