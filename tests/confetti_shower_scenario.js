// ============================================================
// Confetti Shower tests' scenario: main.js on the fake globals, 26 Williams
// tables of the 1990s, 25 played by Guest. Playing the last one unlocks
// three Platinums at once (collection, Williams, 1990s) and a new Player Level. Optionally, a
// week's Challenge that one more Williams table completes. Reads the
// confetti layers and the Level Toasts. Never loaded by PinballY.
// ============================================================

import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import { CONFETTI_Z_INDEX } from "../common/confetti_shower.js";
import { toastDrawings } from "./achievement_toast_reader.js";
import config from "../common/config.js";

const NOW = new Date(2026, 8, 23, 10, 0, 0);
const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const GUEST_PROFILE_FILE = `${PROFILES_FOLDER}\\guest\\profile.json`;
// The week of NOW: any Williams table played completes it.
const WILLIAMS_CHALLENGE = { week: "2026-09-21", template: "manufacturerTables", param: "Williams", target: 1 };
const TABLE_COUNT = 26;
// Longer than a Play's minimum.
const GAME_MS = 2 * 60 * 1000;
// Drawing ahead and every toast of a batch, rise, hold and fade.
export const ALL_TOASTS_MS = 30000;

export const TABLES = Array.from({ length: TABLE_COUNT }, (_, index) => ({
    id: index + 1, configId: `Table ${index + 1} (Williams 1995)`, title: `Table ${index + 1}`,
    manufacturer: "Williams", year: 1995, categories: [],
    playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false,
}));
export const LAST_TABLE = TABLES[TABLE_COUNT - 1];
// Imported late: i18n reads the language the scenario sets.
export async function challengeTitle() {
    const { default: lang } = await import("../common/i18n.js");
    return lang.challenges.titles.manufacturerTables(WILLIAMS_CHALLENGE.target, WILLIAMS_CHALLENGE.param);
}
// Already played: playing it again unlocks no Platinum.
export const PLAYED_TABLE = TABLES[0];

// The main-window layers of the Confetti Shower.
export const confettiLayers = fake => fake.drawingLayers().filter(layer => layer.zIndex === CONFETTI_Z_INDEX);
export const visibleConfettiCount = fake => confettiLayers(fake).filter(layer => layer.alpha > 0).length;
export const showerStartLogs = fake => fake.logLines().filter(line => line.startsWith("[ConfettiShower] Started"));

// Level Toasts drawn so far: Platinums bring a new Player Level.
export const levelToastCount = fake => toastDrawings(fake).filter(drawing => drawing.texts.includes("LEVEL UP")).length;

// Steps by stepMs until the Level Toast shows; returns the ms elapsed since
// the shower started, or null when none shows within maxMs.
export function msFromShowerToLevelToast(fake, { stepMs, maxMs }) {
    let showerAtMs = null;
    for (let elapsedMs = 0; elapsedMs <= maxMs; elapsedMs += stepMs) {
        if (showerAtMs === null && showerStartLogs(fake).length > 0) showerAtMs = elapsedMs;
        if (levelToastCount(fake) > 0) return elapsedMs - showerAtMs;
        fake.advanceTime(stepMs);
    }
    return null;
}

// confetti, confettiSoundFile, achievementSoundFile: the settings;
// soundFiles: the files that exist; challenge: with the Challenges Add-on
// and the Williams Challenge.
export async function startScenario({
    confetti = true, confettiSoundFile = "", achievementSoundFile = "", soundFiles = [], challenge = false,
} = {}) {
    const fake = createFakePinballYHost({ now: NOW, tables: TABLES });
    const plays = Object.fromEntries(TABLES.slice(0, TABLE_COUNT - 1).map(table =>
        [table.configId, { count: 1, seconds: 600, lastPlayed: "2026-09-01T20:00:00" }]));
    fake.addFile(GUEST_PROFILE_FILE, JSON.stringify({ version: 1, plays, notified: [] }));
    if (challenge) {
        fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({
            version: 1, activeProfile: "guest", challenge: { current: WILLIAMS_CHALLENGE, previous: null },
        }));
    }
    for (const file of soundFiles) fake.addFile(file);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    const addOns = challenge ? ["achievements", "challenges"] : ["achievements"];
    for (const key of Object.keys(config.addOns)) config.addOns[key] = addOns.includes(key);
    config.language = "en";
    config.confetti = confetti;
    config.confettiSoundFile = confettiSoundFile;
    config.achievementSoundFile = achievementSoundFile;

    await import("../main.js");
    await settle();
    return fake;
}

// Advances by steps of stepMs, calling onStep after each, until it returns
// true (then returns the elapsed ms) or maxMs runs out (then returns null).
export function advanceUntil(fake, { stepMs, maxMs }, onStep) {
    for (let elapsedMs = stepMs; elapsedMs <= maxMs; elapsedMs += stepMs) {
        fake.advanceTime(stepMs);
        if (onStep(elapsedMs)) return elapsedMs;
    }
    return null;
}

// Plays the last table for a whole Play and returns to the wheel; the
// Platinum Achievements are checked once the deferred check has run.
// duringGame runs while the game is on, after its time has passed.
export async function playLastTable(fake, duringGame = () => {}) {
    await playTable(fake, LAST_TABLE, duringGame);
}

export async function playTable(fake, table, duringGame = () => {}) {
    fake.playGame(table);
    fake.gameStarted(table);
    await settle();
    fake.advanceTime(GAME_MS);
    duringGame();
    fake.gameOver(table);
    await settle();
}
