// ============================================================
// The Profile Stats, started through main.js on the fake PinballY globals:
// their main menu entry sits right after the Achievement List entry, the
// Achievements button agrees with the real Achievement List and opens it,
// Exit there bringing the Profile Stats back on that button, and the Most
// Played Tables and Tables to Discover buttons close them and put the
// wheel on their selection.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { chromeTexts, pressAndGlide, isListOpen } from "./achievement_list_reader.js";
import { isProfileStatsOpen, openProfileStats, buttons, highlighted, choose, PROFILE_STATS_OPEN_MS } from "./profile_stats_reader.js";

const NOW = new Date(2026, 8, 23, 10, 0, 0);

function table(id, title, manufacturer, year) {
    return {
        id, configId: `${title} (${manufacturer} ${year})`, title, manufacturer, year, categories: [],
        playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false, isConfigured: true,
    };
}

const MEDIEVAL = table(1, "Medieval Madness", "Williams", 1997);
const MARS = table(2, "Attack from Mars", "Bally", 1995);
const GODZILLA = table(3, "Godzilla", "Stern", 2021);

const GUEST_PROFILE_FILE = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles\\guest\\profile.json";
const GUEST_PLAYS = {
    [MEDIEVAL.configId]: { count: 3, seconds: 5400, lastPlayed: "2026-09-20T20:00:00" },
};

// A separator has no title.
const SEPARATOR = undefined;

test("the Achievements button opens the Achievement List and the selection buttons set the wheel's filter", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: [MEDIEVAL, MARS, GODZILLA] });
    fake.addFile(GUEST_PROFILE_FILE, JSON.stringify({ version: 1, plays: GUEST_PLAYS, notified: [] }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = ["customMenuCommands", "achievements", "hallOfFame", "tablesToDiscover"].includes(key);
    }
    config.language = "en";

    const { default: lang } = await import("../common/i18n.js");
    const TEXT = lang.profileStats;
    await import("../main.js");
    await settle();

    fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }, { title: "Exit", cmd: 99 }]);
    const mainMenu = fake.currentMenu().items.map(item => item.title);
    assert.deepEqual(mainMenu.slice(mainMenu.indexOf(lang.achievementList.menuEntry)), [
        lang.achievementList.menuEntry, TEXT.menuEntry, SEPARATOR, "Exit",
    ]);

    // The Achievement List's own total, read from its header.
    const readListTotal = () => chromeTexts(fake).find(text => /^\d+ \/ \d+ /.test(text)).match(/\d+/g).slice(0, 2).join("/");
    openProfileStats(fake, lang);
    const [achievementsButton] = buttons(fake);
    assert.equal(achievementsButton.label, TEXT.buttons.achievements);
    choose(fake, TEXT.buttons.achievements);
    assert.equal(isProfileStatsOpen(fake), false, "the Achievement List takes their place");
    assert.ok(isListOpen(fake));
    assert.equal(achievementsButton.count, readListTotal(), "the button's count agrees with the list");
    pressAndGlide(fake, "Exit");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.equal(isListOpen(fake), false);
    assert.equal(isProfileStatsOpen(fake), true, "Exit from the list brings the Profile Stats back");
    assert.equal(highlighted(fake), TEXT.buttons.achievements, "on the Achievements button");

    choose(fake, TEXT.buttons.mostPlayedTables);
    assert.equal(isProfileStatsOpen(fake), false);
    assert.equal(fake.currentFilterId(), "User.project.HallOfFame");
    assert.deepEqual(fake.getWheelTables().map(game => game.title), ["Medieval Madness"]);

    openProfileStats(fake, lang);
    choose(fake, TEXT.buttons.tablesToDiscover);
    assert.equal(isProfileStatsOpen(fake), false);
    assert.equal(fake.currentFilterId(), "User.project.TablesToDiscover");
    assert.deepEqual(fake.getWheelTables().map(game => game.title), ["Attack from Mars", "Godzilla"]);
    assert.deepEqual(fake.launches(), [], "the player launches a table with Play");

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
