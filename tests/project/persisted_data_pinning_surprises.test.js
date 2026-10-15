// ============================================================
// Pinning test of the Surprises part: its key in profile.json, its flags,
// seasons, runs and Achievement IDs. These strings are players' saved
// progress: this test must keep passing unchanged. In a file of its own:
// it installs the fake PinballY globals, which the other pinning tests
// already gave to main.js.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import { createProfileStore } from "../../common/profiles/profile_store.js";
import { buildSurprisesAchievements } from "../../achievements/surprises.js";
import { createSurprises } from "../../common/achievements/surprises.js";

const SECONDS_PER_HOUR = 3600;
const GUEST_PROFILE_FILE = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles\\guest\\profile.json";

const TABLES = [
    {
        id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness (Williams 1997)",
        manufacturer: "Williams", year: 1997, categories: ["Fantasy"],
        playCount: 5, playTime: 60 * SECONDS_PER_HOUR, lastPlayed: new Date(2025, 0, 1), rating: 4, isHidden: false,
    },
    {
        id: 2, configId: "Attack from Mars (Bally 1995)", title: "Attack from Mars (Bally 1995)",
        manufacturer: "Bally", year: 1995, categories: ["SciFi", "Classic"],
        playCount: 3, playTime: 50 * SECONDS_PER_HOUR, lastPlayed: new Date(2026, 5, 1), rating: 5, isHidden: false,
    },
    {
        id: 3, configId: "Space Trip (VPX Community 2021)", title: "Space Trip (VPX Community 2021)",
        manufacturer: "VPX Community", year: 2021, categories: [],
        playCount: 1, playTime: 100, lastPlayed: new Date(2026, 7, 1), rating: 3, isHidden: false,
    },
    {
        id: 4, configId: "Homebrew Table", title: "Homebrew Table",
        manufacturer: "", year: 0, categories: [],
        playCount: 2, playTime: 200, lastPlayed: new Date(2026, 8, 1), rating: 2, isHidden: false,
    },
    // Hidden: must produce no Gottlieb, 1970s or "Retro" achievement.
    {
        id: 5, configId: "Hidden Table (Gottlieb 1978)", title: "Hidden Table (Gottlieb 1978)",
        manufacturer: "Gottlieb", year: 1978, categories: ["Retro"],
        playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: true,
    },
];

test("the Surprises part keeps its key in profile.json, its flags, seasons, runs and Achievement IDs", () => {
    // Every table shown, the hidden 1978 one included: Time Travel is built
    // only when the visible tables cover three decades.
    const tables = TABLES.map(game => ({ ...game, isHidden: false }));
    // Friday 13 November 2026, 01:01: Night Owl, Friday the 13th and Mirror Hour at once.
    const fake = createFakePinballYHost({ now: new Date(2026, 10, 13, 1, 1, 0), tables });
    // Never uninstalled: buildSurprisesAchievements reads the shared Profile store.
    fake.installGlobals();
    const store = createProfileStore(fake);
    createSurprises(fake, store);
    const playAt = (date, table = tables[0]) => {
        fake.setNow(date);
        fake.gameStarted(table);
        fake.advanceTime(5 * 60 * 1000);
        fake.gameOver(table);
    };
    // The 2020s, the 1990s, then the 1970s: Time Travel.
    playAt(new Date(2026, 10, 13, 1, 1, 0), tables[2]);
    playAt(new Date(2026, 10, 14, 10, 0, 0), tables[0]);
    playAt(new Date(2026, 10, 15, 10, 0, 0), tables[4]);
    // Monday 14 December 2026, 12:30, then Wednesday 23 December at 22:00
    // under a full moon, a Play in spring and two in summer: five Plays in
    // a row on one table, so One More Game! too.
    playAt(new Date(2026, 11, 14, 12, 30, 0));
    playAt(new Date(2026, 11, 23, 22, 0, 0));
    playAt(new Date(2027, 3, 1, 10, 0, 0));
    playAt(new Date(2027, 6, 1, 10, 0, 0));
    playAt(new Date(2027, 6, 2, 10, 0, 0));

    assert.deepEqual(JSON.parse(fake.readFile(GUEST_PROFILE_FILE)).surprises, {
        nightOwl: true, fridayThe13th: true, mirrorHour: true, lunchBreak: true, fullMoonNight: true,
        seasons: ["autumn", "winter", "spring", "summer"],
        oneMoreGame: true, oneMoreGameRun: { configId: tables[0].configId, count: 5 },
        timeTravel: true, timeTravelRun: { decade: 1990, count: 1 },
    });
    assert.deepEqual(buildSurprisesAchievements().map(achievement => achievement.id),
        ["nightOwl", "fullMoonNight", "fridayThe13th", "fourSeasons", "oneMoreGame", "lunchBreak", "mirrorHour", "timeTravel"]);
});