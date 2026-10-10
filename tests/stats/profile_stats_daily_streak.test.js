// ============================================================
// The Daily Streak tile of the drawn Profile Stats, through main.js on the
// fake PinballY globals, in English, with the session stats tracker Add-on
// off: the streak row shows the Daily Streak first, then the Table of the
// Day and Table of the Week Streaks; the longest run of the whole Play Log
// (New Year's Eve included) in a pill, the gold record pill while the
// current one sets it, and 0 with its longest once broken.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";
import { openProfileStats, section, press } from "./profile_stats_reader.js";

// Thursday 8 October 2026, in the morning.
const NOW = new Date(2026, 9, 8, 10, 0, 0);
const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const MEDIEVAL = {
    id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", manufacturer: "Williams", year: 1997, categories: [],
    playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false, isConfigured: true,
};

const playLogJson = starts => JSON.stringify({ version: 1, plays: starts.map(start => ({ start, configId: MEDIEVAL.configId, seconds: 600 })) });

test("the Profile Stats show the Daily Streak first in the streak row, its longest in a pill", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: [MEDIEVAL] });
    // Four days in a row, a gap, then two days up to yesterday.
    fake.addFile(`${PROFILES}\\Alice\\play-log-2026.json`, playLogJson([
        "2026-10-01T21:00:00", "2026-10-02T21:00:00", "2026-10-03T21:00:00", "2026-10-04T21:00:00",
        "2026-10-06T21:00:00", "2026-10-07T20:00:00", "2026-10-07T22:00:00",
    ]));
    // Two days up to yesterday, its only run.
    fake.addFile(`${PROFILES}\\Bob\\play-log-2026.json`, playLogJson(["2026-10-06T21:00:00", "2026-10-07T21:00:00"]));
    // Three days across New Year's Eve, then nothing since.
    fake.addFile(`${PROFILES}\\Carol\\play-log-2025.json`, playLogJson(["2025-12-30T21:00:00", "2025-12-31T23:50:00"]));
    fake.addFile(`${PROFILES}\\Carol\\play-log-2026.json`, playLogJson(["2026-01-01T15:00:00", "2026-10-05T21:00:00"]));
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["achievements", "profilePicker"].includes(key);
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    const { getProfileStore } = await import("../../common/profile_store.js");
    const TEXT = lang.profileStats;
    await import("../../main.js");
    await settle();

    function streakRow() {
        openProfileStats(fake, lang);
        const progression = section(fake, TEXT.sections.progression, TEXT.stats);
        press(fake, "Exit");
        return progression;
    }

    assert.equal(TEXT.stats.cabinetStreak, "Days in a row");
    const alice = streakRow();
    assert.deepEqual(Object.keys(alice).slice(1), [TEXT.stats.cabinetStreak, TEXT.stats.dayStreak, TEXT.stats.weekStreak],
        "the Daily Streak first, the Period Table Streaks after it");
    assert.deepEqual(alice[TEXT.stats.cabinetStreak], ["2", TEXT.record(4)], "today has no Play yet, the streak is still alive");

    fake.gameStarted(MEDIEVAL);
    fake.advanceTime(10 * 60 * 1000);
    fake.gameOver(MEDIEVAL);
    await settle();
    assert.deepEqual(streakRow()[TEXT.stats.cabinetStreak], ["3", TEXT.record(4)], "today's Play counts");

    getProfileStore().switchTo("Bob");
    await settle();
    assert.deepEqual(streakRow()[TEXT.stats.cabinetStreak], ["2", TEXT.record(2)], "the current run is the longest");

    getProfileStore().switchTo("Carol");
    await settle();
    assert.deepEqual(streakRow()[TEXT.stats.cabinetStreak], ["0", TEXT.record(3)], "broken, its longest across New Year's Eve");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
