// ============================================================
// The Collection's percentage in the Profile Stats, through main.js on
// the fake PinballY globals: 199 tables played out of 200 show "99%",
// never "100%" while a table is left to play; the last one brings "100%".
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";
import { openProfileStats, section, press } from "./profile_stats_reader.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";

const TABLES = Array.from({ length: 200 }, (_, index) => ({
    id: index + 1, configId: `Table ${index + 1} (Williams 1990)`, title: `Table ${index + 1}`, manufacturer: "Williams", year: 1990,
    categories: [], playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false, isConfigured: true,
}));

test("the Collection shows 100% only once every table was played", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 10, 0, 0), tables: TABLES });
    const plays = Object.fromEntries(TABLES.slice(1).map(game =>
        [game.configId, { count: 1, seconds: 600, lastPlayed: "2026-09-20T20:00:00" }]));
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({ version: 1, notified: [], plays }));
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["achievements", "profilePicker"].includes(key);
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    const STATS = lang.profileStats;
    await import("../../main.js");
    await settle();

    function collectionShown() {
        openProfileStats(fake, lang);
        const progression = section(fake, STATS.sections.progression, STATS.stats);
        press(fake, "Exit");
        return progression[STATS.stats.collection];
    }

    assert.deepEqual(collectionShown(), ["199/200", "99%"], "one table left to play");
    fake.gameStarted(TABLES[0]);
    await settle();
    fake.advanceTime(5 * 60 * 1000);
    fake.gameOver(TABLES[0]);
    await settle();
    assert.deepEqual(collectionShown(), ["200/200", "100%"]);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
