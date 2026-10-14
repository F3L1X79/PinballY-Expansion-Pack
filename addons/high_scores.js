// ============================================================
// High Scores: credits each score that entered a ROM table's board during
// a Play to the Profile active when the Play started, whatever initials
// were typed. At "prelaunch" the board is read fresh and becomes the last
// known board; a little after "postlaunch" it is read again and the Play
// settled against it. A failed launch read leaves the last known board to
// compare with; a failed read after the game credits nothing. A Play that
// won places submits one High Score Toast, for the best place. Writes
// high_scores.json next to cabinet.json and logfile.log. Adds the "High
// Scores" main menu entry, which opens the High Score Board on the
// selected table, Exit there going back to the menu on that entry; each
// opening reads the board again without PinballY's cache, recorded as a
// board read outside a Play. The rules live in common/high_scores/.
// ============================================================

import { createPinballYHost } from "../common/core/pinbally_host.js";
import { safeHandler, logHandlerError } from "../common/core/safe_handler.js";
import { getProfileStore } from "../common/profiles/profile_store.js";
import { readBoard } from "../common/high_scores/board_reader.js";
import { getHighScoreStore, SCRIPT_NAME } from "../common/high_scores/high_score_store.js";
import { createHighScoreBoard } from "../common/high_scores/high_score_board.js";
import { getAchievementToasts, TOAST_KIND } from "../common/achievements/achievement_toast.js";
import { getMainMenu, MAIN_MENU_POSITION } from "../common/menus/main_menu.js";
import { getWheelDialogs } from "../common/core/wheel_dialog.js";
import lang from "../common/core/i18n.js";

// PinballY's own read after the game returns the board cached at launch
// (seen on the cabinet): the Add-on reads again a little later, fresh.
const AFTER_READ_DELAY_MS = 2000;
// PinballY kills PINemHi after 7.5 s; a read may also wait behind another one.
const READ_TIMEOUT_MS = 10000;
const BOARD_ENTRY = "highScoreBoard";

export default function init() {
    const host = createPinballYHost();
    const profileStore = getProfileStore();
    const highScores = getHighScoreStore();
    const toasts = getAchievementToasts();
    const log = text => host.log(`[${SCRIPT_NAME}] ${text}`);
    // From "prelaunch" to "postlaunch": { configId, launchRead (a promise) }.
    let launched = null;
    // The Play the Profile store announced for the launched table, if any.
    let announcedPlay = null;

    const board = createHighScoreBoard(host, { highScores, refresh: refreshBoard });
    const mainMenu = getMainMenu();
    mainMenu.add({
        name: BOARD_ENTRY,
        label: lang.highScores.board.menuEntry,
        position: MAIN_MENU_POSITION.HIGH_SCORE_BOARD,
        // Exit goes back one level: the main menu, on this entry.
        action: () => board.open(() => mainMenu.reopenOn(BOARD_ENTRY)),
    });
    // Drawn over the wheel without leaving its UI mode: a waiting dialog
    // shows only once the player is back on the wheel.
    getWheelDialogs().waitFor(board);

    const wait = ms => new Promise(resolve => host.setTimeout(resolve, ms));

    // The table's board, read by PINemHi without PinballY's cache when
    // forget is set: { status: "read", places }, or { status } "unsupported"
    // or "failed" (failed, timed out), logged.
    function readTable(configId, { forget = false } = {}) {
        return new Promise((resolve) => {
            const game = host.getGameInfo(configId);
            if (!game) {
                resolve({ status: "failed" });
                return;
            }
            let finished = false;
            const finish = (result) => {
                if (finished) return;
                finished = true;
                host.clearTimeout(timer);
                resolve(result);
            };
            const timer = host.setTimeout(safeHandler(SCRIPT_NAME, () => {
                log(`"${configId}": the high scores read timed out.`);
                finish({ status: "failed" });
            }), READ_TIMEOUT_MS);
            if (forget) game.setHighScores(null);
            game.getHighScores().then((lines) => {
                // Settled at once even when reading the lines throws, so no "timed out" follows.
                try {
                    const board = readBoard(lines);
                    if (board.status === "unsupported") log(`"${configId}": PINemHi does not support its ROM.`);
                    finish(board.status === "unsupported" ? { status: "unsupported" } : { status: "read", places: board.places });
                } catch (error) {
                    finish({ status: "failed" });
                    logHandlerError(SCRIPT_NAME, error);
                }
            }, safeHandler(SCRIPT_NAME, (error) => {
                log(`"${configId}": the high scores read failed (${error instanceof Error ? error.message : String(error)}).`);
                finish({ status: "failed" });
            }));
        });
    }

    // The table's board places, or null when the read did not give a board.
    const readPlaces = (configId, options) => readTable(configId, options)
        .then(result => (result.status === "read" ? result.places : null));

    // The High Score Board's read, by config ID while it runs, so a second
    // opening reuses it.
    const boardReads = new Map();
    // From "postlaunch" until the Play is settled: { configId, settled }, a
    // promise that never rejects.
    let settling = null;

    // A fresh read for the High Score Board, recorded as a board read
    // outside a Play: resolves to its status ("read", "unsupported",
    // "failed") once the store holds it, whether the screen is still open
    // or not. Waits for a Play being settled on the table first: read
    // before it, the Play's new places would be recorded as Default Scores.
    function refreshBoard(configId) {
        if (boardReads.has(configId)) return boardReads.get(configId);
        const fresh = () => readTable(configId, { forget: true });
        const raw = settling && settling.configId === configId ? settling.settled.then(fresh) : fresh();
        const read = raw.then(safeHandler(SCRIPT_NAME, (result) => {
            boardReads.delete(configId);
            if (result.status === "read") highScores.recordBoard(configId, result.places);
            else log(`"${configId}": no board for the High Score Board; ${highScores.boardOf(configId) === null ? "none known yet" : "the last known board kept"}.`);
            return result.status;
        }));
        boardReads.set(configId, read);
        return read;
    }

    // One toast per Play, for the best place won; the toast module holds
    // it until the wheel is back and the toasts before it have shown.
    function announce(configId, place) {
        const TEXT = lang.highScores;
        const game = host.getGameInfo(configId);
        const table = game ? game.title : configId;
        toasts.submit({
            kind: TOAST_KIND.HIGH_SCORE,
            tileNumber: place.rank,
            title: place.rank === 1 ? TEXT.tableRecordTitle(table) : TEXT.toastTitle(table, place.rank),
            description: TEXT.toastScore(lang.profileStats.number(place.score)),
            onShown: () => {},
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

    // The board read after the game, settled against the last known one.
    async function settleAfterGame(bracket, play) {
        await bracket.launchRead;
        await wait(AFTER_READ_DELAY_MS);
        const places = await readPlaces(bracket.configId, { forget: true });
        if (places === null) {
            log(`"${bracket.configId}": no board after the game; nothing credited, the last known board kept.`);
            return;
        }
        const best = highScores.settlePlay(bracket.configId, places, play);
        if (best) announce(bracket.configId, best);
    }

    // Fires after the game, back on the wheel, once the Table ROMs Add-on
    // confirmed the ROM the table ran.
    host.on("postlaunch", safeHandler(SCRIPT_NAME, () => {
        const bracket = launched;
        const play = announcedPlay;
        launched = null;
        announcedPlay = null;
        if (!bracket) return;
        const settled = safeHandler(SCRIPT_NAME, settleAfterGame)(bracket, play).then(() => {}, () => {});
        const current = { configId: bracket.configId, settled };
        settling = current;
        settled.then(() => {
            if (settling === current) settling = null;
        });
    }));
}
