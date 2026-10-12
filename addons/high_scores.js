// ============================================================
// High Scores: credits each score that entered a ROM table's board during
// a Play to the Profile active when the Play started, whatever initials
// were typed. At "prelaunch" the board is read fresh and becomes the last
// known board; a little after "postlaunch" it is read again and the Play
// settled against it. A failed launch read leaves the last known board to
// compare with; a failed read after the game credits nothing. Only
// output: high_scores.json next to cabinet.json and logfile.log. The rules
// live in common/high_scores/.
// ============================================================

import { createPinballYHost } from "../common/core/pinbally_host.js";
import { safeHandler, logHandlerError } from "../common/core/safe_handler.js";
import { getProfileStore } from "../common/profiles/profile_store.js";
import { readBoard } from "../common/high_scores/board_reader.js";
import { createHighScoreStore, SCRIPT_NAME } from "../common/high_scores/high_score_store.js";

// PinballY's own read after the game returns the board cached at launch
// (seen on the cabinet): the Add-on reads again a little later, fresh.
const AFTER_READ_DELAY_MS = 2000;
// PinballY kills PINemHi after 7.5 s; a read may also wait behind another one.
const READ_TIMEOUT_MS = 10000;

export default function init() {
    const host = createPinballYHost();
    const profileStore = getProfileStore();
    const highScores = createHighScoreStore(host, profileStore);
    const log = text => host.log(`[${SCRIPT_NAME}] ${text}`);
    // From "prelaunch" to "postlaunch": { configId, launchRead (a promise) }.
    let launched = null;
    // The Play the Profile store announced for the launched table, if any.
    let announcedPlay = null;

    const wait = ms => new Promise(resolve => host.setTimeout(resolve, ms));

    // The table's board places, read by PINemHi without PinballY's cache
    // when forget is set; null when the read fails, times out or the ROM
    // is not supported, logged.
    function readPlaces(configId, { forget = false } = {}) {
        return new Promise((resolve) => {
            const game = host.getGameInfo(configId);
            if (!game) {
                resolve(null);
                return;
            }
            let finished = false;
            const finish = (places) => {
                if (finished) return;
                finished = true;
                host.clearTimeout(timer);
                resolve(places);
            };
            const timer = host.setTimeout(safeHandler(SCRIPT_NAME, () => {
                log(`"${configId}": the high scores read timed out.`);
                finish(null);
            }), READ_TIMEOUT_MS);
            if (forget) game.setHighScores(null);
            game.getHighScores().then((lines) => {
                // Settled at once even when reading the lines throws, so no "timed out" follows.
                try {
                    const board = readBoard(lines);
                    if (board.status === "unsupported") log(`"${configId}": PINemHi does not support its ROM.`);
                    finish(board.status === "unsupported" ? null : board.places);
                } catch (error) {
                    finish(null);
                    logHandlerError(SCRIPT_NAME, error);
                }
            }, safeHandler(SCRIPT_NAME, (error) => {
                log(`"${configId}": the high scores read failed (${error instanceof Error ? error.message : String(error)}).`);
                finish(null);
            }));
        });
    }

    // Fires as a table launches: PinballY just cleared its cached board.
    host.on("prelaunch", safeHandler(SCRIPT_NAME, (ev) => {
        announcedPlay = null;
        const { configId } = ev.game;
        const launchRead = readPlaces(configId).then(safeHandler(SCRIPT_NAME, (places) => {
            if (places !== null) highScores.recordBoard(configId, places);
        }));
        launched = { configId, launchRead };
    }));

    profileStore.onPlay(safeHandler(SCRIPT_NAME, (play) => {
        if (launched && play.configId === launched.configId) announcedPlay = play;
    }));

    // Fires after the game, back on the wheel, once the Table ROMs Add-on
    // confirmed the ROM the table ran.
    host.on("postlaunch", safeHandler(SCRIPT_NAME, async () => {
        const bracket = launched;
        const play = announcedPlay;
        launched = null;
        announcedPlay = null;
        if (!bracket) return;
        await bracket.launchRead;
        await wait(AFTER_READ_DELAY_MS);
        const places = await readPlaces(bracket.configId, { forget: true });
        if (places === null) {
            log(`"${bracket.configId}": no board after the game; nothing credited, the last known board kept.`);
            return;
        }
        highScores.settlePlay(bracket.configId, places, play);
    }));
}
