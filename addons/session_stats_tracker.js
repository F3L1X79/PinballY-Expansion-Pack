// ============================================================
// Records the session stats of a Profile in the "sessions" part of its
// profile.json: longest / shortest session, "grand return", "rage quit"
// and the Day's Manufacturers.
// - Facts are noted at "gamestarted" and recorded on the Play (onPlay), for the Profile active at its start.
// - Runs synchronously so it finishes before achievements_engine's deferred check.
// ============================================================

import { safeHandler } from "../common/core/safe_handler.js";
import { TABLE_OF_THE_DAY } from "../common/tables/period_table.js";
import { getProfileStore } from "../common/profiles/profile_store.js";

// A game from RAGE_QUIT_MIN_SECONDS to under RAGE_QUIT_MAX_SECONDS, Play or
// not, sets the "rage quit" flag: long enough to have really played, short
// enough to have given up. Exported so the Achievement description shows
// the same values.
export const RAGE_QUIT_MIN_SECONDS = 30;
export const RAGE_QUIT_MAX_SECONDS = 60;
// Break (in days) after which replaying a table sets the "grand return" flag.
// Exported so the Achievement description shows the same value.
export const GRAND_RETURN_THRESHOLD_DAYS = 31;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const SCRIPT_NAME = "SessionStatsTracker";

// Whether the manufacturer is missing from the Day's Manufacturers of that
// calendar day (the same day key as the Table of the Day's).
function isNewDayManufacturer(sessions, manufacturer, day) {
    if (!manufacturer) return false;
    return sessions.dayManufacturers.day !== day || !sessions.dayManufacturers.list.includes(manufacturer);
}

// Adds the manufacturer to that day's Day's Manufacturers, starting a new
// set on a new calendar day, and keeps the one-day record up to date.
function addDayManufacturer(sessions, manufacturer, day) {
    const list = sessions.dayManufacturers.day === day ? sessions.dayManufacturers.list : [];
    sessions.dayManufacturers = { day, list: [...list, manufacturer] };
    sessions.mostManufacturersInADay = Math.max(sessions.mostManufacturersInADay, list.length + 1);
}

// Whether the Play started at least GRAND_RETURN_THRESHOLD_DAYS after the
// Profile's previous Play of the table.
function isGrandReturn(previousLastPlayed, start) {
    if (!previousLastPlayed) return false;
    return (start.getTime() - new Date(previousLastPlayed).getTime()) / MS_PER_DAY >= GRAND_RETURN_THRESHOLD_DAYS;
}

export default function init() {
    const profileStore = getProfileStore();
    // The Profile active at "gamestarted" and when the game started, by
    // table, for the "rage quit" timing.
    const runningGames = new Map();
    // What each started game's Play needs, by table: the manufacturer and
    // the Profile's previous Play of the table, noted now since the store
    // overwrites lastPlayed before announcing the Play. Kept apart from
    // runningGames so the order of the "gameover" listeners never matters;
    // a game that is no Play leaves its entry until the table's next start.
    const startedGames = new Map();

    // Fires on table launch: notes its start and the facts its Play needs.
    mainWindow.on("gamestarted", safeHandler(SCRIPT_NAME, ev => {
        const { configId, manufacturer } = ev.game;
        runningGames.set(configId, { profileName: profileStore.getActiveProfile().name, startMs: Date.now() });
        startedGames.set(configId, { manufacturer, previousLastPlayed: profileStore.getPlay(configId).lastPlayed });
    }));

    // Fires on table exit: flags a "rage quit", for the Profile active
    // when the game started.
    mainWindow.on("gameover", safeHandler(SCRIPT_NAME, ev => {
        const running = runningGames.get(ev.game.configId);
        runningGames.delete(ev.game.configId);
        if (!running) return;
        const durationSeconds = (Date.now() - running.startMs) / 1000;
        if (durationSeconds < RAGE_QUIT_MIN_SECONDS || durationSeconds >= RAGE_QUIT_MAX_SECONDS) return;
        profileStore.updateProfileData(({ sessions }) => { sessions.rageQuit = true; }, running.profileName);
    }));

    // Fires on "gameover" for a Play only: records its length, its
    // manufacturer for the calendar day it started, and a "grand return".
    profileStore.onPlay(safeHandler(SCRIPT_NAME, ({ profileName, configId, start, seconds }) => {
        const started = startedGames.get(configId);
        startedGames.delete(configId);
        if (!started) return;
        const playDay = TABLE_OF_THE_DAY.getPeriodKey(start);
        profileStore.updateProfileData(({ sessions }) => {
            sessions.longestSeconds = Math.max(sessions.longestSeconds, seconds);
            if (sessions.shortestSeconds === 0 || seconds < sessions.shortestSeconds) {
                sessions.shortestSeconds = seconds;
            }
            if (isNewDayManufacturer(sessions, started.manufacturer, playDay)) {
                addDayManufacturer(sessions, started.manufacturer, playDay);
            }
            if (isGrandReturn(started.previousLastPlayed, start)) sessions.grandReturn = true;
        }, profileName);
    }));
}
