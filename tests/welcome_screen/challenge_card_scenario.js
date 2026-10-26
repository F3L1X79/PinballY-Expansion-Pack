// ============================================================
// Starts main.js on the fake host with a week's Challenge locked in
// cabinet.json and followed by Alice, for the Welcome Screen's Challenge
// Table card scenarios; the Period Tables are locked on the Williams tables.
// Never loaded by PinballY.
// ============================================================

import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { WELCOME_SCREEN_OPEN_MS } from "./welcome_screen_reader.js";

export const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
export const ALICE_FILE = `${PROFILES}\\Alice\\profile.json`;
// Wednesday 23 September 2026: its week starts Monday 21.
export const NOW = new Date(2026, 8, 23, 10, 0, 0);
export const WEEK = "2026-09-21";

const table = (id, title, manufacturer) => ({
    id, configId: `${title} (${manufacturer})`, title, manufacturer, year: 1995,
    playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false,
});
export const DAY_TABLE = table(1, "Medieval Madness", "Williams");
export const WEEK_TABLE = table(2, "Twilight Zone", "Williams");
export const STERN_A = table(3, "Godzilla", "Stern");
export const STERN_B = table(4, "Deadpool", "Stern");
export const STERN_C = table(5, "Jaws", "Stern");
export const TABLES = [DAY_TABLE, WEEK_TABLE, STERN_A, STERN_B, STERN_C];

export const STERN_CHALLENGE = { week: WEEK, template: "manufacturerTables", param: "Stern", target: 3 };

// A game the Challenge already counted, as its module notes them.
export const countedGame = game => ({
    configId: game.configId, manufacturer: game.manufacturer, decade: 1990, day: "2026-09-22", seconds: 300, randomGame: false,
    isTableOfTheDay: false, isTableOfTheWeek: false, wasNeverPlayed: true, wasDusty: false,
});

// The choices without a Challenge Table card, in English.
export const choicesWithoutChallengeCard = lang => [
    lang.profiles.menuEntry, lang.buttonHints.close, lang.welcomeScreen.periodCards.day.period, lang.welcomeScreen.periodCards.week.period,
    lang.welcomeScreen.randomTable, lang.welcomeScreen.stayOn("Medieval Madness"),
];

// Plays the game for the given seconds: a minute or more makes it a Play.
export function playFor(fake, game, seconds) {
    fake.gameStarted(game);
    fake.advanceTime(seconds * 1000);
    fake.gameOver(game);
}

// challenge: the week's, locked; games: what Alice's Challenge counted;
// plays: Alice's play records; addOns: the enabled Add-ons. Returns the
// fake once the Welcome Screen is open.
export async function startWithChallenge({
    challenge = STERN_CHALLENGE, games = [], completed = false, plays = {}, tables = TABLES,
    addOns = ["startupChoicePrompt", "profilePicker", "challenges"], language = "en",
} = {}) {
    const fake = createFakePinballYHost({ now: NOW, tables });
    fake.addFile(ALICE_FILE, JSON.stringify({
        version: 1, notified: [], plays,
        challenge: { firstWeek: WEEK, week: WEEK, games, completed, completedCount: completed ? 1 : 0, judgedWeek: "", history: [] },
    }));
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({
        version: 1,
        activeProfile: "Alice",
        tableOfTheDay: { configId: DAY_TABLE.configId, period: "2026-09-23" },
        tableOfTheWeek: { configId: WEEK_TABLE.configId, period: WEEK },
        challenge: { current: challenge, previous: null },
    }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = addOns.includes(key);
    config.language = language;
    await import("../../main.js");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    return fake;
}
