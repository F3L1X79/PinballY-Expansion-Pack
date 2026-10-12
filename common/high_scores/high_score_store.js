// ============================================================
// High Score store: the High Scores Add-on's memory, in high_scores.json
// next to cabinet.json (through the Profile store, so no Profile Reset
// touches it), rewritten whole on each change. Per table (by config ID):
// the last known board, each place with its owner (a Profile name, or
// null for a Default Score). Every High Score ever won, kept when later
// scores push it off the board. A board read outside a Play becomes the
// last known board; settling a Play credits its new places to the Profile
// active when it started, unless there are more than a 4-player game can
// make (a ROM reset: they become Default Scores). Every board change and
// High Score is logged.
// ============================================================

import { newPlaces, placeKey } from "./board_reader.js";
import { toLocalIsoString } from "../profiles/profile_store.js";

const RECORD_NAME = "high_scores";
const RECORD_VERSION = 1;
// More new places than a 4-player game can make: the ROM went back to its
// factory scores, which stay on the board as the scores to beat.
const MAX_NEW_PLACES_PER_PLAY = 4;
// The High Scores Add-on's name in logfile.log, for its shared modules too.
export const SCRIPT_NAME = "HighScores";

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
    const profileExists = name => profileStore.listProfileNames().some(candidate => candidate.toLowerCase() === name.toLowerCase());

    // A table with no known board takes the places as its baseline, all Default Scores.
    function takeBaseline(configId, places, why) {
        setBoard(configId, withOwners(places, [], null));
        save();
        log(`"${configId}": ${why}`);
    }

    return {
        // A board read outside a Play (places from the board reader): the
        // places it did not know are Default Scores, set outside the pack.
        recordBoard(configId, places) {
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
        },
        // The board read after a game, compared with the last known board;
        // play: the Play the Profile store announced ({ profileName, start, ... }),
        // or null for a game under a minute. The new places are Default
        // Scores after a game under a minute or a ROM reset.
        settlePlay(configId, places, play) {
            const known = knownBoardOf(configId);
            if (!known) {
                takeBaseline(configId, places, "no board known before the game; the board after it is the baseline, nothing credited.");
                return;
            }
            const added = newPlaces(known, places);
            const romReset = added.length > MAX_NEW_PLACES_PER_PLAY;
            const credited = play !== null && !romReset;
            const board = withOwners(places, known, credited ? play.profileName : null);
            const changed = JSON.stringify(board) !== JSON.stringify(known);
            setBoard(configId, board);
            if (!credited) {
                save();
                const game = play ? `a Play by ${play.profileName}` : "a game under a minute";
                if (romReset) log(`"${configId}": ${countPlaces(added.length)} after ${game}, more than a ${MAX_NEW_PLACES_PER_PLAY}-player game can make: a ROM reset, nothing credited, the new places are Default Scores.`);
                else if (changed) log(`"${configId}": ${countPlaces(added.length)} after ${game}, as Default Scores.`);
                return;
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
        },
    };
}
