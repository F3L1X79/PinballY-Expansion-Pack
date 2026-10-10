// ============================================================
// Surprises tests' scenario: main.js on the fake globals with the session
// stats and the Achievements only, two tables without a manufacturer or a
// year (or the test's own tables), Guest active, Alice and Bob (a Child
// Profile) beside it. Moves the clock to a given moment, plays one of the
// tables and reads the toasts it brought, opens the Achievement List and
// reads its rows. Never loaded by PinballY.
// ============================================================

import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import { toastDrawings } from "./achievement_toast_reader.js";
import { readRows, press } from "./achievement_list_reader.js";
import config from "../../common/config.js";

export const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
export const profileFile = name => `${PROFILES}\\${name}\\profile.json`;
const PLAY_MS = 5 * 60 * 1000;
// Under a minute, and too short for a rage quit.
export const SHORT_GAME_MS = 20 * 1000;
// Longer than an Achievement Toast's whole life (rise, hold, fade).
const TOAST_MS = 6000;

// A table without a manufacturer, and without a year unless given one.
export function table(id, title, { year = 0, categories = [], isHidden = false } = {}) {
    return {
        id, configId: title, title, manufacturer: "", year, categories,
        playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden,
    };
}

export const TABLE = table(1, "Homebrew Table");
export const PERIOD_TABLE = table(2, "Period Table");

// now: the clock at startup; files: { path: content } kept from an
// earlier run, written over the default Profiles; tables: the cabinet's
// tables, TABLE and PERIOD_TABLE by default.
export async function startSurprisesScenario({ now, files = {}, tables = [TABLE, PERIOD_TABLE] }) {
    const fake = createFakePinballYHost({ now, tables });
    const defaultFiles = {
        [`${PROFILES}\\cabinet.json`]: JSON.stringify({ version: 1, activeProfile: "guest" }),
        [profileFile("Alice")]: JSON.stringify({ version: 1 }),
        [profileFile("Bob")]: JSON.stringify({ version: 1, isChild: true }),
    };
    for (const [path, content] of Object.entries({ ...defaultFiles, ...files })) fake.addFile(path, content);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = ["sessionStatsTracker", "achievements"].includes(key);
    }
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    const { getProfileStore } = await import("../../common/profile_store.js");
    const TEXT = lang.achievements;
    const LIST_TEXT = lang.achievementList;
    await import("../../main.js");
    await settle();
    const store = getProfileStore();

    // Moves the clock forward to that day (month counted from 0) and time.
    function waitUntil(year, month, day, hours, minutes) {
        const target = new Date(year, month, day, hours, minutes, 0, 0);
        if (target < fake.now()) throw new Error(`${target} is in the past`);
        fake.advanceTime(target - fake.now());
    }

    // Plays a game on that table and returns the titles its toasts showed.
    async function play(gameMs = PLAY_MS, table = TABLE) {
        const before = toastDrawings(fake).length;
        fake.gameStarted(table);
        await settle();
        fake.advanceTime(gameMs);
        fake.gameOver(table);
        await settle();
        // Toasts show one after the other: let every toast of this game show.
        for (let guard = 0; guard < 100; guard++) {
            const shownCount = toastDrawings(fake).length;
            fake.advanceTime(TOAST_MS);
            if (toastDrawings(fake).length === shownCount) break;
        }
        return toastDrawings(fake).slice(before).flatMap(drawing => drawing.texts);
    }

    function listRows() {
        fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
        fake.selectMenuItem(LIST_TEXT.menuEntry);
        const rows = readRows(fake, LIST_TEXT);
        press(fake, "Exit");
        return rows;
    }

    async function switchTo(name) {
        store.switchTo(name);
        await settle();
    }

    return { fake, store, TEXT, LIST_TEXT, waitUntil, play, listRows, switchTo };
}

// Whether the rows show that secret missing ("???" and its hint) and
// nothing of its real texts.
export function showsMissing(rows, { title, description, hint }, secretTitle) {
    return rows.some(row => row.title === secretTitle && row.description === hint && !row.unlocked)
        && !rows.some(row => row.title === title || row.description === description);
}

// Whether the rows show that secret Unlocked, with its real texts.
export function showsUnlocked(rows, { title, description }) {
    return rows.some(row => row.title === title && row.description === description && row.unlocked);
}
