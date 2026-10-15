// ============================================================
// The main menu's sections in French with Menu Cleanup on, through main.js
// on the fake PinballY globals, for a non-Admin Profile once the household
// has an Admin: PinballY's information entries are gone, Table Setup too,
// the filter groups are behind "Filtrer les tables", and no separator is
// doubled; the Achievement List entry reads "Vos succès".
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const ADD_ONS_UNDER_TEST = [
    "uiTranslation", "customMenuCommands", "menuCleanup", "profilePicker", "achievements", "highScores",
    "hallOfFame", "tablesToDiscover", "challenges",
];
const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const SEPARATOR = "---";

test("a non-Admin Profile's cleaned main menu runs in its sections, in French", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 30, 20, 0, 0) });
    fake.addFolder(`${PROFILES}\\Alice`);
    fake.addFile(`${PROFILES}\\Bob\\profile.json`, JSON.stringify({ version: 1, isAdmin: true }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "fr";
    const { default: lang } = await import("../../common/core/i18n.js");
    const { getProfileStore } = await import("../../common/profiles/profile_store.js");
    await import("../../main.js");
    await settle();
    getProfileStore().switchTo("Alice");
    const LABELS = lang.customMenuLabels;

    fake.openMainMenu();
    const titles = fake.currentMenu().items.map(item => (item.cmd === -1 && !item.title ? SEPARATOR : item.title));

    assert.deepEqual(titles, [
        "Jouer", LABELS.tableOfTheDay, LABELS.tableOfTheWeek, LABELS.randomGame, SEPARATOR,
        lang.profiles.menuEntry, "Vos succès", "Vos statistiques", SEPARATOR,
        lang.highScores.board.menuEntry, "Noter la table", "Ajouter aux favoris", SEPARATOR,
        "Toutes les tables", LABELS.challengeTables, LABELS.tablesToDiscoverFilter, LABELS.hallOfFameFilter, "Tables favorites", SEPARATOR,
        "Filtrer les tables", SEPARATOR,
        "Retour",
    ]);
    assertNoErrorLogged(fake);
});
