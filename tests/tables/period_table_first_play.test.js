// ============================================================
// First play Achievements, started through main.js on the fake PinballY
// globals: a Profile whose Table of the Day Streak is already in its
// profile.json, but was never announced, gets "first play" announced at
// startup, and never again on later checks.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import { toastDrawings } from "../achievements/achievement_toast_reader.js";
import config from "../../common/config.js";

const NOW = new Date(2026, 8, 23, 10, 0, 0);
const SESSION_MS = 5 * 60 * 1000;

// Without manufacturer and never counted as played, so only the seeded
// Streak can unlock an Achievement.
const TABLE = {
    id: 1, configId: "Homebrew Table", title: "Homebrew Table", manufacturer: "", year: 0, categories: [],
    playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false,
};

// Longer than an Achievement Toast's whole life (rise, hold, fade).
const TOAST_MS = 6000;

test("a Streak never announced announces the first play once", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: [TABLE] });
    fake.addFile("C:\\PinballY\\Scripts\\ExpansionPack\\profiles\\guest\\profile.json", JSON.stringify({
        version: 1,
        streaks: { tableOfTheDay: { current: 1, longest: 1, lastPeriod: "2026-08-01", periodsPlayed: 1 } },
    }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = key === "achievements";
    }
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    const TEXT = lang.achievements;
    await import("../../main.js");
    await settle();

    // Whether each Achievement Toast so far announced the daily first play.
    const announcements = () => toastDrawings(fake).map(drawing => drawing.texts.includes(TEXT.dailyFirstPlayTitle()));
    assert.deepEqual(announcements(), [true]);
    fake.advanceTime(TOAST_MS);

    // A play triggers the next checks, with the first play still Unlocked.
    // The only table is also the Table of the Week: that one is announced now.
    fake.gameStarted(TABLE);
    await settle();
    fake.advanceTime(SESSION_MS);
    fake.gameOver(TABLE);
    await settle();

    assert.equal(announcements().filter(Boolean).length, 1, "announced only once");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
