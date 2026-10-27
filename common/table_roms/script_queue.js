// ============================================================
// Script reading queue of the Table ROMs Add-on: runs tools\vpxtool.exe
// hidden on each VPX table whose script needs reading, one at a time,
// polling for the answer so PinballY never waits.
// - A failure is logged, not recorded: the table is read again next startup.
// - No run starts from "prelaunch" until back on the wheel.
// ============================================================

import { safeHandler, logHandlerError } from "../core/safe_handler.js";
import { logError } from "../core/error_log.js";
import { SCRIPT_NAME } from "./table_rom_record.js";

export const SCRIPT_READ_TIMEOUT_MS = 60 * 1000;
const POLL_MS = 500;
// Letters, digits and underscores only: anything else is not a ROM name.
const ROM_NAME = /^[A-Za-z0-9_]+$/;

// What vpxtool's standard output says: { rom } with the ROM named on its
// last non-empty line, { rom: null } when empty (the script loads no ROM),
// or { unreadable } with that line when it is no ROM name.
export function readRomOutput(output) {
    const lines = output.split(/\r?\n/).map(line => line.trim()).filter(line => line !== "");
    if (lines.length === 0) return { rom: null };
    const lastLine = lines[lines.length - 1];
    return ROM_NAME.test(lastLine) ? { rom: lastLine } : { unreadable: lastLine };
}

// onVpxtoolMissing: run at start when vpxtool is not in the tools folder.
export function createScriptQueue(host, record, { onVpxtoolMissing = () => {} } = {}) {
    const log = text => host.log(`[${SCRIPT_NAME}] ${text}`);
    const vpxtoolPath = `${host.getProjectFolder()}\\tools\\vpxtool.exe`;
    // vpxtool reads the script from the .vbs beside the .vpx when there is one.
    const fileStateOf = vpxPath => ({
        vpx: host.files.getFileInfo(vpxPath),
        vbs: host.files.getFileInfo(vpxPath.replace(/\.vpx$/i, ".vbs")),
    });

    function tablesToRead() {
        const tables = [];
        for (const game of host.getAllTables()) {
            const gameFile = game.resolveGameFile();
            if (!gameFile.exists || !/\.vpx$/i.test(gameFile.path)) continue;
            const state = fileStateOf(gameFile.path);
            if (record.needsScriptRead(game.configId, state)) tables.push({ configId: game.configId, path: gameFile.path, state });
        }
        return tables;
    }

    const logFailure = (table, reason) => logError(SCRIPT_NAME, `ERROR reading the script of "${table.configId}": ${reason}; read again at the next startup.`, host);

    function applyAnswer(table, { exitCode, output }) {
        if (exitCode !== 0) {
            logFailure(table, `vpxtool exit code ${exitCode}`);
            return;
        }
        const answer = readRomOutput(output);
        if (answer.unreadable !== undefined) {
            logFailure(table, `vpxtool's output is no ROM name: "${answer.unreadable}"`);
            return;
        }
        record.applyScriptRead(table.configId, table.state, answer.rom);
    }

    // True from a table's launch until PinballY is back on the wheel.
    let gameUnderWay = false;
    // The tables left when the next one waits for the game to end.
    let waitingTables = null;
    // The run in progress: { startMs }, its time limit counted from startMs.
    let currentRun = null;

    function readNext(queue) {
        currentRun = null;
        if (gameUnderWay) {
            waitingTables = queue;
            return;
        }
        const table = queue.shift();
        if (!table) return;
        // A run that cannot even start would fail for every table: the
        // queue stops, to start over at the next startup.
        const run = host.runHiddenProgram(vpxtoolPath, ["romname", table.path]);
        const thisRun = { startMs: host.now().getTime() };
        currentRun = thisRun;

        // Fires every POLL_MS until vpxtool answers or the time is up, which
        // never comes during a game. A vpxtool that never answers is left
        // running: the next table starts.
        const poll = safeHandler(SCRIPT_NAME, () => {
            // One table's trouble never stops the others.
            try {
                const result = run.result();
                if (result === null && (gameUnderWay || host.now().getTime() - thisRun.startMs < SCRIPT_READ_TIMEOUT_MS)) {
                    host.setTimeout(poll, POLL_MS);
                    return;
                }
                if (result === null) logFailure(table, `no answer from vpxtool within ${SCRIPT_READ_TIMEOUT_MS / 1000} s`);
                else applyAnswer(table, result);
            } catch (error) {
                logHandlerError(SCRIPT_NAME, error);
            }
            readNext(queue);
        });
        host.setTimeout(poll, POLL_MS);
    }

    function endGame() {
        if (!gameUnderWay) return;
        gameUnderWay = false;
        // The game slowed the run in progress: it gets its full time again.
        if (currentRun) currentRun.startMs = host.now().getTime();
        const queue = waitingTables;
        waitingTables = null;
        if (queue) readNext(queue);
    }

    host.on("prelaunch", safeHandler(SCRIPT_NAME, () => {
        gameUnderWay = true;
        // A tick later, a launch another script cancelled shows no runMode:
        // PinballY stayed on the wheel and fires no other launch event.
        host.setTimeout(safeHandler(SCRIPT_NAME, () => {
            if (host.getFullUIMode().runMode === undefined) endGame();
        }), 0);
    }));
    // Pauses again should PinballY report the launch only after that tick.
    host.on("gamestarted", safeHandler(SCRIPT_NAME, () => { gameUnderWay = true; }));
    // A failed launch fires "launcherror" instead of the game's events.
    for (const eventName of ["postlaunch", "launcherror"]) host.on(eventName, safeHandler(SCRIPT_NAME, endGame));
    // Fires on every return to the wheel, also after a menu opened during a game.
    host.on("wheelmode", safeHandler(SCRIPT_NAME, () => {
        if (host.getFullUIMode().runMode === undefined) endGame();
    }));

    return {
        start: () => {
            if (!host.files.fileExists(vpxtoolPath)) {
                logError(SCRIPT_NAME, `ERROR vpxtool not found at ${vpxtoolPath}; the table scripts are not read.`, host);
                onVpxtoolMissing();
                return;
            }
            readNext(tablesToRead());
        },
    };
}
