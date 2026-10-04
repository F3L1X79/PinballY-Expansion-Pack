// ============================================================
// The Achievements add-on, started through main.js on the fake PinballY
// globals, announces its unlocks with Achievement Toasts: never while a
// game runs, staggered, over an open menu without taking it
// over, each one Notified when it starts, with its Achievement Rank's
// emblem, and a toast still waiting when a table launches is announced
// after that game.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import { toastDrawings } from "./achievement_toast_reader.js";
import config from "../common/config.js";
import { ACHIEVEMENT_RANK } from "../common/achievements.js";

const NOW = new Date(2026, 8, 23, 10, 0, 0);
const SECONDS_PER_HOUR = 3600;
// Longer than a toast's whole life (rise, hold, fade).
const ONE_TOAST_MS = 6000;
const ARRIVAL_GAP_MS = 350;

// Two Williams tables, both played by Guest: unlocks at least the
// first-table, Williams and 1990s Achievements at startup.
const TABLES = [
    {
        id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness (Williams 1997)",
        manufacturer: "Williams", year: 1997, categories: [],
        playCount: 5, playTime: 2 * SECONDS_PER_HOUR, lastPlayed: new Date(2026, 8, 1), rating: 4, isHidden: false,
    },
    {
        id: 2, configId: "Attack from Mars (Williams 1995)", title: "Attack from Mars (Williams 1995)",
        manufacturer: "Williams", year: 1995, categories: [],
        playCount: 3, playTime: SECONDS_PER_HOUR, lastPlayed: new Date(2026, 8, 2), rating: 5, isHidden: false,
    },
];

const emblemOf = rank => `C:\\PinballY\\Scripts\\ExpansionPack\\assets\\rank_${rank}.png`;
const GUEST_PROFILE_FILE = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles\\guest\\profile.json";
// Guest played both tables.
const GUEST_PLAYS = {
    [TABLES[0].configId]: { count: 5, seconds: 2 * SECONDS_PER_HOUR, lastPlayed: "2026-09-01T20:00:00" },
    [TABLES[1].configId]: { count: 3, seconds: SECONDS_PER_HOUR, lastPlayed: "2026-09-02T20:00:00" },
};

function notifiedCount(fake) {
    return JSON.parse(fake.readFile(GUEST_PROFILE_FILE)).notified.length;
}

function toasts(fake) {
    return toastDrawings(fake).map(drawing => drawing.texts.join(" | "));
}

test("Achievement Toasts wait for the end of the game, arrive staggered and never take over a menu", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: TABLES });
    fake.addFile(GUEST_PROFILE_FILE, JSON.stringify({ version: 1, plays: GUEST_PLAYS, notified: [] }));
    for (const rank of Object.values(ACHIEVEMENT_RANK)) fake.addFile(emblemOf(rank), "PNG");
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = key === "achievements";
    }
    config.language = "en";

    // A game is already running when the startup check runs.
    fake.playGame(TABLES[0]);
    await import("../main.js");
    await settle();
    fake.advanceTime(ONE_TOAST_MS);

    assert.deepEqual(toasts(fake), [], "no toast while a game runs");
    assert.equal(notifiedCount(fake), 0);

    fake.gameOver(TABLES[0]);
    await settle();
    assert.equal(toasts(fake).length, 1, "first toast on the return to the wheel");
    assert.equal(notifiedCount(fake), 1, "Notified when its toast starts");

    // The next toast arrives a moment later, over an open menu, which stays in charge.
    fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
    fake.advanceTime(ARRIVAL_GAP_MS - 1);
    assert.equal(toasts(fake).length, 1, "the toasts of a batch arrive staggered");
    fake.advanceTime(1);
    assert.equal(toasts(fake).length, 2);
    assert.equal(notifiedCount(fake), 2);
    assert.equal(fake.currentMenu().id, "main");
    assert.equal(fake.getUIMode(), "menu");
    assert.deepEqual(fake.executedCommands(), []);
    fake.closeMenu();

    // A table launched while toasts wait: they are announced after the game.
    fake.playGame(TABLES[1]);
    fake.gameStarted(TABLES[1]);
    fake.advanceTime(10 * ONE_TOAST_MS);
    assert.equal(toasts(fake).length, 2, "no toast while a game runs");
    fake.gameOver(TABLES[1]);
    await settle();
    assert.equal(toasts(fake).length, 3, "the waiting toasts resume after the game");

    for (let guard = 0; guard < 100; guard++) {
        const shownCount = toasts(fake).length;
        fake.advanceTime(ONE_TOAST_MS);
        await settle();
        if (toasts(fake).length === shownCount) break;
    }

    const shownCount = toasts(fake).length;
    assert.ok(shownCount >= 4, `expected several Achievements, got ${shownCount}`);
    assert.equal(notifiedCount(fake), shownCount, "each toast Notified its Achievement");
    assert.equal(new Set(toasts(fake)).size, shownCount, "each Achievement announced once");
    const { getAllAchievements } = await import("../addons/achievements_engine.js");
    const rankByTitle = new Map(getAllAchievements().map(achievement => [achievement.getTitle(), achievement.rank]));
    for (const drawing of toastDrawings(fake)) {
        assert.deepEqual(drawing.images, [emblemOf(rankByTitle.get(drawing.texts[1]))], `${drawing.texts[1]} shows its Rank's emblem`);
    }
    assert.deepEqual(fake.soundsPlayed(), [], "no sound by default");
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
