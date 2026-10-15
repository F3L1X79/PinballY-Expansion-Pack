// ============================================================
// High Score store: the High Scores Add-on's memory, in high_scores.json
// next to cabinet.json (through the Profile store, so no Profile Reset
// touches it), rewritten whole on each change. Per table (by config ID):
// the last known board, each place with its owner (a Profile name, or
// null for a Default Score). Every High Score ever won, kept when later
// scores push it off the board. A board read outside a Play becomes the
// last known board; settling a Play credits its new places to the Profile
// active when it started, unless the ROM was reset: more new places than
// a 4-player game can make, or a place gone that no new place beat (in a
// real game a place only leaves when beaten); they become Default Scores.
// From the game's end until its Play is settled, a board read outside a
// Play on that table waits, recorded after the Play: before it, it would
// take the Play's new places as Default Scores. Every board change and
// High Score is logged. Per Profile, the date its
// High Score Achievements count from, set when the Profile store reports
// its Profile Reset (its High Scores stay its own); the Achievements read
// what each Profile won since then, and hear when a Play credited High
// Scores; the Profile Stats read the tables where each Profile still holds
// a place or the Table Record; the High Score Board reads a table's last
// known board with each place's owner. Per table without a board PinballY
// can read, the source it was learned from ({ kind: "vpreg", section }),
// kept for good.
// ============================================================

import { hasUnbeatenGonePlace, newPlaces, placeKey } from "./board_reader.js";
import { getProfileStore, toLocalIsoString } from "../profiles/profile_store.js";
import { createPinballYHost } from "../core/pinbally_host.js";
import { safeHandler, logHandlerError } from "../core/safe_handler.js";

const RECORD_NAME = "high_scores";
const RECORD_VERSION = 1;
// More new places than a 4-player game can make: the ROM went back to its
// factory scores, which stay on the board as the scores to beat.
const MAX_NEW_PLACES_PER_PLAY = 4;
// The High Scores Add-on's name in logfile.log, for its shared modules too.
export const SCRIPT_NAME = "HighScores";

// Profile names ignore case.
const profileKeyOf = name => name.toLowerCase();
const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);
const countPlaces = count => (count === 1 ? "1 new place" : `${count} new places`);

// The places with their owners: a place of the known board keeps its
// owner, any other one gets newOwner. A board never repeats a place, so
// its key finds it.
function withOwners(places, knownBoard, newOwner) {
    const owners = new Map(knownBoard.map(place => [placeKey(place), place.owner]));
    return places.map(({ rank, initials, score }) => {
        const key = placeKey({ initials, score });
        return { rank, initials, score, owner: owners.has(key) ? owners.get(key) : newOwner };
    });
}

export function createHighScoreStore(host, profileStore) {
    const log = text => host.log(`[${SCRIPT_NAME}] ${text}`);
    const saved = profileStore.readCabinetFile(RECORD_NAME);
    const data = isRecord(saved) && isRecord(saved.tables) && Array.isArray(saved.highScores)
        ? saved
        : { version: RECORD_VERSION, tables: {}, highScores: [] };
    const save = () => profileStore.saveCabinetFile(RECORD_NAME, data);

    const knownBoardOf = (configId) => {
        const entry = data.tables[configId];
        return isRecord(entry) && Array.isArray(entry.board) ? entry.board : null;
    };
    const setBoard = (configId, board) => {
        data.tables[configId] = { ...(isRecord(data.tables[configId]) ? data.tables[configId] : {}), board };
    };
    const learnedSources = () => (isRecord(data.learnedSources) ? data.learnedSources : {});
    const profileExists = name => profileStore.listProfileNames().some(candidate => profileKeyOf(candidate) === profileKeyOf(name));
    // Called with the Profile's name after a Play credited it High Scores.
    const creditedListeners = [];
    // The tables whose Play is being settled, by config ID: the board
    // reads outside a Play waiting for it.
    const heldBoards = new Map();

    // Fires after any change of a Profile's data: its High Score
    // Achievements count afresh from its Profile Reset. The key is written
    // only then, so a file without a reset keeps its first shape.
    profileStore.onUpdate(safeHandler(SCRIPT_NAME, (profileName, { isReset }) => {
        if (!isReset) return;
        if (!isRecord(data.achievementsFrom)) data.achievementsFrom = {};
        data.achievementsFrom[profileKeyOf(profileName)] = toLocalIsoString(host.now());
        save();
    }));

    // A table with no known board takes the places as its baseline, all Default Scores.
    function takeBaseline(configId, places, why) {
        setBoard(configId, withOwners(places, [], null));
        save();
        log(`"${configId}": ${why}`);
    }

    // A board read outside a Play: the places it did not know are Default
    // Scores, set outside the pack.
    function recordOutsidePlay(configId, places) {
        const known = knownBoardOf(configId);
        if (!known) {
            takeBaseline(configId, places, `first board read, ${places.length} places, all Default Scores.`);
            return;
        }
        const board = withOwners(places, known, null);
        if (JSON.stringify(board) === JSON.stringify(known)) return;
        setBoard(configId, board);
        save();
        log(`"${configId}": board changed outside a Play, ${countPlaces(newPlaces(known, places).length)} as Default Scores.`);
    }

    return {
        // A board read outside a Play (places from the board reader),
        // recorded at once or, while a Play on the table is being settled,
        // after it. Resolves once recorded.
        recordBoard(configId, places) {
            const waiting = heldBoards.get(configId);
            if (!waiting) {
                recordOutsidePlay(configId, places);
                return Promise.resolve();
            }
            // Resolved even when recording throws (logged by the release), so no reader waits forever.
            return new Promise(resolve => waiting.push(() => {
                try {
                    recordOutsidePlay(configId, places);
                } finally {
                    resolve();
                }
            }));
        },
        // The board a ROM-less table held before the Play (read from the
        // snapshot taken at launch), recorded as a board read outside a
        // Play while that Play is being settled: it never waits for it.
        recordBoardBeforePlay(configId, places) {
            recordOutsidePlay(configId, places);
        },
        // The source learned for the table, or null.
        sourceOf(configId) {
            const sources = learnedSources();
            return isRecord(sources[configId]) ? sources[configId] : null;
        },
        // The config IDs of every table with a learned source.
        learnedTables() {
            const sources = learnedSources();
            return Object.keys(sources).filter(configId => isRecord(sources[configId]));
        },
        // Remembers for good where the table keeps its board. The key is
        // written only then, so a file without one keeps its first shape.
        learnSource(configId, source) {
            if (!isRecord(data.learnedSources)) data.learnedSources = {};
            data.learnedSources[configId] = source;
            save();
        },
        // From the game's end until its Play is settled (or given up): the
        // board reads outside a Play on the table wait. Returns the
        // release, to call once.
        holdBoardForPlay(configId) {
            const waiting = [];
            heldBoards.set(configId, waiting);
            return () => {
                if (heldBoards.get(configId) === waiting) heldBoards.delete(configId);
                for (const record of waiting) {
                    try {
                        record();
                    } catch (error) {
                        logHandlerError(SCRIPT_NAME, error);
                    }
                }
            };
        },
        // The board read after a game, compared with the last known board;
        // play: the Play the Profile store announced ({ profileName, start, ... }),
        // or null for a game under a minute. The new places are Default
        // Scores after a game under a minute or a ROM reset. Returns the
        // best place credited ({ rank, initials, score }), or null.
        settlePlay(configId, places, play) {
            const known = knownBoardOf(configId);
            if (!known) {
                takeBaseline(configId, places, "no board known before the game; the board after it is the baseline, nothing credited.");
                return null;
            }
            const added = newPlaces(known, places);
            const tooManyNew = added.length > MAX_NEW_PLACES_PER_PLAY;
            const romReset = tooManyNew || hasUnbeatenGonePlace(known, places);
            const credited = play !== null && !romReset;
            const board = withOwners(places, known, credited ? play.profileName : null);
            const changed = JSON.stringify(board) !== JSON.stringify(known);
            setBoard(configId, board);
            if (!credited) {
                save();
                const game = play ? `a Play by ${play.profileName}` : "a game under a minute";
                const resetSign = tooManyNew ? `more than a ${MAX_NEW_PLACES_PER_PLAY}-player game can make` : "but a place gone from the board was beaten by no new place";
                if (romReset) log(`"${configId}": ${countPlaces(added.length)} after ${game}, ${resetSign}: a ROM reset, nothing credited, the new places are Default Scores.`);
                else if (changed) log(`"${configId}": ${countPlaces(added.length)} after ${game}, as Default Scores.`);
                return null;
            }
            const formerOwner = known.length > 0 ? known[0].owner : null;
            for (const place of added) {
                const tableRecord = place.rank === 1;
                const takenFrom = tableRecord && formerOwner !== null && formerOwner.toLowerCase() !== play.profileName.toLowerCase()
                    && profileExists(formerOwner) ? formerOwner : null;
                data.highScores.push({
                    profile: play.profileName, configId, score: place.score, initials: place.initials, place: place.rank,
                    date: toLocalIsoString(play.start), tableRecord, takenFrom,
                });
                const tableRecordNote = takenFrom !== null ? `, Table Record taken from ${takenFrom}` : (tableRecord ? ", Table Record" : "");
                log(`"${configId}": High Score for ${play.profileName}: place ${place.rank}, ${place.score} (${place.initials || "no initials"})${tableRecordNote}.`);
            }
            save();
            if (added.length === 0) log(`"${configId}": Play by ${play.profileName}, no new place${changed ? " (board changed)" : ""}.`);
            else creditedListeners.forEach(listener => listener(play.profileName));
            return added.reduce((best, place) => (best === null || place.rank < best.rank ? place : best), null);
        },
        // What the named Profile's High Score Achievements count, from the
        // High Scores it won since its last Profile Reset: the tables with
        // one, the tables with a Table Record, and whether it took a Table
        // Record from another Profile.
        achievementCountsOf(profileName) {
            const profileKey = profileKeyOf(profileName);
            const from = (isRecord(data.achievementsFrom) && data.achievementsFrom[profileKey]) || "";
            const won = data.highScores.filter(highScore => typeof highScore.profile === "string"
                && profileKeyOf(highScore.profile) === profileKey && highScore.date >= from);
            const tablesOf = highScores => new Set(highScores.map(highScore => highScore.configId)).size;
            return {
                highScoreTables: tablesOf(won),
                tableRecordTables: tablesOf(won.filter(highScore => highScore.tableRecord)),
                tookTableRecord: won.some(highScore => typeof highScore.takenFrom === "string"),
            };
        },
        // Where the named Profile stands on the last known boards today,
        // counted in tables: those where it has a place, and those whose
        // first place is its own. A removed Profile's places read as
        // Default Scores, nothing rewritten: a Profile re-created under its
        // name gets them back. Every known board counts, a hidden or
        // removed table's too: hiding a table never erases a record.
        heldBy(profileName) {
            if (!profileExists(profileName)) return { highScores: 0, tableRecords: 0 };
            const isOwn = place => typeof place.owner === "string" && profileKeyOf(place.owner) === profileKeyOf(profileName);
            const boards = Object.keys(data.tables).map(knownBoardOf).filter(board => board !== null);
            return {
                highScores: boards.filter(board => board.some(isOwn)).length,
                tableRecords: boards.filter(board => board.length > 0 && isOwn(board[0])).length,
            };
        },
        // The table's last known board as the High Score Board shows it, in
        // board order: { rank, initials, score, owner }, the owner the
        // Profile store's Profile ({ name, isGuest, avatarPath }) or null for
        // a Default Score, a removed Profile's places included, nothing
        // rewritten. Null when the table was never read.
        boardOf(configId) {
            const known = knownBoardOf(configId);
            if (!known) return null;
            const profiles = profileStore.listProfiles();
            const ownerOf = name => (typeof name === "string"
                && profiles.find(profile => profileKeyOf(profile.name) === profileKeyOf(name))) || null;
            return known.map(({ rank, initials, score, owner }) => ({ rank, initials, score, owner: ownerOf(owner) }));
        },
        onCredited(listener) { creditedListeners.push(listener); },
    };
}

let sharedHighScoreStore = null;

// The one store the High Scores Add-on, the Achievements and the stats share.
export function getHighScoreStore() {
    if (!sharedHighScoreStore) sharedHighScoreStore = createHighScoreStore(createPinballYHost(), getProfileStore());
    return sharedHighScoreStore;
}
