// ============================================================
// Shared scenario for the dialog priority tests: starts the Welcome
// Screen, Achievements and rating prompt add-ons on the fake PinballY
// globals in a given init order (as main.js would), then checks that the
// Welcome Screen comes first, the Achievements unlocked at startup waiting
// for it to close before their toasts show, and that the rating prompt is
// the only native dialog, the Achievements going on with toasts alongside it.
// ============================================================

import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import { toastDrawings } from "./achievement_toast_reader.js";
import { WELCOME_SCREEN_OPEN_MS, isWelcomeScreenOpen, choose } from "./welcome_screen_reader.js";
import config from "../common/config.js";

const NOW = new Date(2026, 8, 23, 10, 0, 0);
const SECONDS_PER_HOUR = 3600;
// Enough for the first toast to start.
const TOAST_RISE_MS = 1000;

// Guest's plays of the first table unlock Achievements at startup; the
// second, never played nor rated, crosses the rating threshold in a
// marathon session.
const TABLES = [
    {
        id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness (Williams 1997)",
        manufacturer: "Williams", year: 1997, categories: [],
        playCount: 5, playTime: 2 * SECONDS_PER_HOUR, lastPlayed: new Date(2026, 8, 1), rating: 4, isHidden: false,
    },
    {
        id: 2, configId: "Attack from Mars (Bally 1995)", title: "Attack from Mars (Bally 1995)",
        manufacturer: "Bally", year: 1995, categories: [],
        playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false,
    },
];

const GUEST_PROFILE_FILE = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles\\guest\\profile.json";
const GUEST_PLAYS = {
    [TABLES[0].configId]: { count: 5, seconds: 2 * SECONDS_PER_HOUR, lastPlayed: "2026-09-01T20:00:00" },
};

const MODULE_PATHS = {
    sessionStatsTracker: "../addons/session_stats_tracker.js",
    achievements: "../addons/achievements_engine.js",
    ratingPrompt: "../addons/rating_prompt.js",
    startupChoicePrompt: "../addons/welcome_screen.js",
};

export async function runDialogPriorityScenario(initOrder) {
    const fake = createFakePinballYHost({ now: NOW, tables: TABLES });
    fake.addFile(GUEST_PROFILE_FILE, JSON.stringify({ version: 1, plays: GUEST_PLAYS, notified: [] }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    config.language = "en";
    config.askToRateAfterMinutesPlayed = 60;

    const { default: lang } = await import("../common/i18n.js");
    // All imported first, then started in one go, as main.js does: no tick
    // runs between two inits.
    const modules = await Promise.all(initOrder.map(key => import(MODULE_PATHS[key])));
    for (const module of modules) module.default();
    await settle();

    const shownIds = () => fake.shownMenus().map(menu => menu.id);

    const toastCount = () => toastDrawings(fake).length;

    // Startup: the Welcome Screen first, no native dialog; the Achievements
    // unlocked at startup wait for it to close.
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true);
    assert.deepEqual(shownIds(), [], "no native dialog over the Welcome Screen");
    assert.equal(toastCount(), 0, "no toast over the Welcome Screen");
    choose(fake, lang.welcomeScreen.stayOn("Medieval Madness"));
    await settle();
    fake.advanceTime(TOAST_RISE_MS);
    assert.ok(toastCount() > 0, "an Achievement unlocked at startup is announced once it closed");

    // Session: the rating prompt is the only dialog; the Achievements go on
    // with toasts.
    const shownBeforeSession = shownIds().length;
    const toastsBeforeSession = toastCount();
    const game = fake.getGameInfo(2);
    fake.playGame(game);
    fake.gameStarted(game);
    fake.advanceTime(61 * 60 * 1000);
    game.playTime = 61 * 60;
    fake.gameOver(game);
    await settle();

    assert.deepEqual(shownIds().slice(shownBeforeSession), ["ratingPrompt"]);
    assert.ok(toastCount() > toastsBeforeSession, "the Achievements are announced after the session");

    fake.selectMenuItem(lang.ratingPrompt.rateNow);
    await settle();
    assert.deepEqual(fake.executedCommands(), [globalThis.command.RateGame]);
    assert.equal(fake.currentMenu(), null);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
}
