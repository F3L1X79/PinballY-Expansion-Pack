// ============================================================
// High Scores: credits each score that entered a table's board during a
// Play to the Profile active when the Play started, whatever initials
// were typed. At "prelaunch" the board is read fresh and becomes the last
// known board; a little after "postlaunch" it is read again and the Play
// settled against it. A failed launch read leaves the last known board to
// compare with; a failed read after the game credits nothing. When
// PinballY reads no board (a table without a ROM), the board comes from
// VPX's VPReg.stg, read whole at "prelaunch" and again after the game,
// never while VPX runs: the table's section is learned from the one board
// section the Play changed, kept for good, and the board it held before
// the Play recorded first, so its places are Default Scores. A Play that
// won places submits one High Score Toast, for the best place. Writes
// high_scores.json next to cabinet.json and logfile.log. Adds the "High
// Scores" main menu entry, which opens the High Score Board on the
// selected table, Exit there going back to the menu on that entry; each
// opening reads the board again without PinballY's cache, recorded as a
// board read outside a Play. Replaces PinballY's own "High Scores": removes
// its main menu entry and cancels the HighScores command, which opens the
// board instead, Exit going back to the wheel. The rules live in
// common/high_scores/.
// ============================================================

import { createPinballYHost } from "../common/core/pinbally_host.js";
import { safeHandler, logHandlerError } from "../common/core/safe_handler.js";
import { getProfileStore } from "../common/profiles/profile_store.js";
import { getProfileRewards } from "../common/avatar_frames/profile_rewards.js";
import { readBoard } from "../common/high_scores/board_reader.js";
import { readCompoundFile } from "../common/high_scores/compound_file_reader.js";
import { readSectionBoard } from "../common/high_scores/romless_board_reader.js";
import { getHighScoreStore, SCRIPT_NAME } from "../common/high_scores/high_score_store.js";
import { createHighScoreBoard } from "../common/high_scores/high_score_board.js";
import { getAchievementToasts, TOAST_KIND } from "../common/achievements/achievement_toast.js";
import { getMainMenu, MAIN_MENU_POSITION } from "../common/menus/main_menu.js";
import { getDrawingAhead } from "../common/core/drawing_ahead.js";
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
    // From "prelaunch" to "postlaunch": { configId, launchRead (a promise),
    // snapshot (VPReg.stg at launch) }.
    let launched = null;
    // The Play the Profile store announced for the launched table, if any.
    let announcedPlay = null;

    const board = createHighScoreBoard(host, {
        highScores, profileRewards: getProfileRewards(), drawingAhead: getDrawingAhead(), refresh: refreshBoard,
    });
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

    // The board replaces PinballY's own "High Scores": its window and its
    // main menu entry, the DMD's high score text left as it is.
    const highScoresCommand = host.getBuiltInCommand("HighScores");
    const isSeparator = item => item.cmd < 0 && !item.title;

    // Fires when any menu opens, with a fresh item list each time; removes
    // PinballY's entry whether Menu Cleanup is on or not. The native
    // entries around it depend on the table's media: should it stand alone
    // between two separators, one of them goes with it.
    host.on("menuopen", safeHandler(SCRIPT_NAME, (ev) => {
        const at = ev.id === "main" ? ev.items.findIndex(item => item.cmd === highScoresCommand) : -1;
        if (at === -1) return;
        const items = ev.items.filter(item => item.cmd !== highScoresCommand);
        if (at > 0 && at < items.length && isSeparator(items[at - 1]) && isSeparator(items[at])) items.splice(at, 1);
        ev.items = items;
        ev.menuUpdated = true;
    }));

    // Fires on every command; the dedicated HighScores button opens the
    // board on the selected table, Exit going straight back to the wheel.
    // Cancelled in any UI mode, but opened only over the wheel: Exit could
    // not bring a menu or popup under the board back.
    host.on("command", safeHandler(SCRIPT_NAME, (ev) => {
        if (ev.id !== highScoresCommand || ev.defaultPrevented) return;
        ev.preventDefault();
        if (host.getUIMode() === "wheel") board.open();
    }));

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

    // A fresh read for the High Score Board, recorded as a board read
    // outside a Play: resolves to its status ("read", "unsupported",
    // "failed") once the store holds it (after a Play being settled on the
    // table, if any), whether the screen is still open or not.
    function refreshBoard(configId) {
        if (boardReads.has(configId)) return boardReads.get(configId);
        const read = readTable(configId, { forget: true }).then(safeHandler(SCRIPT_NAME, async (result) => {
            try {
                if (result.status === "read") await highScores.recordBoard(configId, result.places);
                else log(`"${configId}": no board for the High Score Board; ${highScores.boardOf(configId) === null ? "none known yet" : "the last known board kept"}.`);
                return result.status;
            } finally {
                boardReads.delete(configId);
            }
        })).then(status => status, () => "failed");
        boardReads.set(configId, read);
        return read;
    }

    // VPX keeps VPReg.stg in the User folder beside its executable
    // (VPinballX.exe, VPinballX64.exe, VPinballX_GL64.exe...); null for a
    // table of another system, such as Future Pinball.
    function vpregPathOf(configId) {
        const game = host.getGameInfo(configId);
        const exe = game && game.system ? String(game.system.exe || "") : "";
        const folderEnd = exe.lastIndexOf("\\");
        if (folderEnd === -1 || !/^vpinballx/i.test(exe.slice(folderEnd + 1))) return null;
        return `${exe.slice(0, folderEnd)}\\User\\VPReg.stg`;
    }

    // VPReg.stg read whole: { sections }, or { error } (logged only when
    // the board is needed: a ROM table's PINemHi board never consults it).
    function takeSnapshot(configId) {
        const path = vpregPathOf(configId);
        if (path === null) return { error: null };
        try {
            if (!host.files.fileExists(path)) return { error: `${path} not found` };
            return { sections: readCompoundFile(host.files.readBytes(path)) };
        } catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }

    // Two snapshots' values of a section are the same, in any order.
    const sameValues = (a, b) => {
        if (!a || !b) return a === b;
        const keys = Object.keys(a);
        return keys.length === Object.keys(b).length && keys.every(key => a[key] === b[key]);
    };

    // The table's learned section, or the one board section the Play
    // changed, learned now; null when there is none (logged).
    function sectionOf(configId, before, after) {
        const learned = highScores.sourceOf(configId);
        if (learned && learned.kind === "vpreg") return learned.section;
        const changed = Object.keys(after).filter(name => !sameValues(before[name], after[name]) && readSectionBoard(after[name]) !== null);
        if (changed.length !== 1) {
            log(changed.length === 0
                ? `"${configId}": no board after the game, and no VPReg.stg board changed; nothing learned, nothing credited.`
                : `"${configId}": no board after the game, and ${changed.length} VPReg.stg boards changed (${changed.join(", ")}); nothing learned, nothing credited.`);
            return null;
        }
        highScores.learnSource(configId, { kind: "vpreg", section: changed[0] });
        log(`"${configId}": VPReg.stg section "${changed[0]}" learned.`);
        return changed[0];
    }

    // The table's VPReg.stg boards around the Play: { before, after },
    // before null when its section did not exist yet; null when there is
    // no board after the game (logged).
    function romlessBoards(configId, before, after) {
        const failed = [before, after].find(snapshot => !snapshot.sections);
        if (failed) {
            const why = failed.error === null ? "" : ` (VPReg.stg: ${failed.error})`;
            log(`"${configId}": no board after the game; nothing credited, the last known board kept${why}.`);
            return null;
        }
        const section = sectionOf(configId, before.sections, after.sections);
        if (section === null) return null;
        const afterBoard = after.sections[section] ? readSectionBoard(after.sections[section]) : null;
        if (afterBoard === null) {
            log(`"${configId}": no board in VPReg.stg section "${section}" after the game; nothing credited, the last known board kept.`);
            return null;
        }
        return { before: before.sections[section] ? readSectionBoard(before.sections[section]) : null, after: afterBoard };
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
        // Read at once, before VPX starts and holds the file.
        launched = { configId, launchRead, snapshot: takeSnapshot(configId) };
    }));

    profileStore.onPlay(safeHandler(SCRIPT_NAME, (play) => {
        if (launched && play.configId === launched.configId) announcedPlay = play;
    }));

    // The board read after the game, settled against the last known one.
    async function settleAfterGame(bracket, play) {
        await bracket.launchRead;
        await wait(AFTER_READ_DELAY_MS);
        let places = await readPlaces(bracket.configId, { forget: true });
        if (places === null) {
            const boards = romlessBoards(bracket.configId, bracket.snapshot, takeSnapshot(bracket.configId));
            if (boards === null) return;
            if (boards.before !== null) highScores.recordBoardBeforePlay(bracket.configId, boards.before);
            places = boards.after;
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
        const release = highScores.holdBoardForPlay(bracket.configId);
        safeHandler(SCRIPT_NAME, settleAfterGame)(bracket, play).then(release, release);
    }));
}
