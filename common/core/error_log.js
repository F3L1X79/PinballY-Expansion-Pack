// ============================================================
// Error Log: every error the pack logs goes to logfile.log, its line
// unchanged, and to errors.log in the pack folder, which PinballY does not
// recreate at each launch. Once per start, an errors.log over 1 MB becomes
// errors.old.log before the first line. Warnings and information never come here.
// - Never throws for errors.log: a failure is one logfile.log line per session.
// ============================================================

import { createPinballYHost } from "./pinbally_host.js";
import { PACK_VERSION } from "./pack_version.js";

const SCRIPT_NAME = "ErrorLog";
const ERROR_LOG_NAME = "errors.log";
const OLD_ERROR_LOG_NAME = "errors.old.log";
const ROTATION_SIZE_BYTES = 1024 * 1024;
const STACK_INDENT = "    ";

// By errors.log path: whichever host instance writes first rotates the file
// and reports a failure, once for the whole session.
const sessionStates = new Map();
let sharedHost = null;

const twoDigits = number => String(number).padStart(2, "0");
const timestampOf = date => `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())} `
    + `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}:${twoDigits(date.getSeconds())}`;

// The logfile.log line's first line after the date, time and Pack Version;
// its other lines (a stack) below it, indented.
function entryOf(line, now) {
    const [first, ...others] = line.split(/\r?\n/);
    const stack = others.map(other => other.trim()).filter(other => other.length > 0).map(other => STACK_INDENT + other);
    return [`${timestampOf(now)} v${PACK_VERSION} ${first}`, ...stack].map(entryLine => `${entryLine}\r\n`).join("");
}

function rotateWhenFull(files, folder, path) {
    const info = files.getFileInfo(path);
    if (!info || info.size <= ROTATION_SIZE_BYTES) return;
    const oldPath = `${folder}\\${OLD_ERROR_LOG_NAME}`;
    if (files.fileExists(oldPath)) files.deleteFile(oldPath);
    files.renameFile(path, oldPath);
}

// message: the line's text after "[<scriptName>] ", as logfile.log shows it
// ("ERROR ..."), with the stack on its next lines when there is one. host:
// the caller's own, PinballY's globals otherwise.
export function logError(scriptName, message, host = null) {
    if (!host) {
        if (!sharedHost) sharedHost = createPinballYHost();
        host = sharedHost;
    }
    const line = `[${scriptName}] ${message}`;
    host.log(line);

    let state = null;
    const reportFailure = (error) => {
        if (state && state.failureLogged) return;
        if (state) state.failureLogged = true;
        host.log(`[${SCRIPT_NAME}] ${ERROR_LOG_NAME} could not be written: ${error.message}`);
    };
    try {
        const folder = host.getProjectFolder();
        const path = `${folder}\\${ERROR_LOG_NAME}`;
        if (!sessionStates.has(path)) sessionStates.set(path, { rotationChecked: false, failureLogged: false });
        state = sessionStates.get(path);
        if (!state.rotationChecked) {
            state.rotationChecked = true;
            // A failed rotation still lets this line in, the file staying over 1 MB.
            try {
                rotateWhenFull(host.files, folder, path);
            } catch (error) {
                reportFailure(error);
            }
        }
        host.files.appendText(path, entryOf(line, host.now()));
    } catch (error) {
        reportFailure(error);
    }
}
