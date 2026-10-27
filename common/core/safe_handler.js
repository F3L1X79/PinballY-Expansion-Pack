// ============================================================
// Shared error guard for event handlers, timer callbacks and async menu
// commands. main.js only protects each script's init(), so an uncaught
// error in a handler would otherwise escape to the engine or become an
// unhandled promise rejection. Wrapped handlers log the error as
// "[<ScriptName>] ..." to logfile.log and the Error Log, and never rethrow.
// ============================================================

import { logError } from "./error_log.js";

export function logHandlerError(scriptName, error) {
    let details;
    try {
        if (error instanceof Error) {
            // The stack already starts with "<Name>: <message>" in the engine,
            // so only fall back to the message when no stack is available.
            details = error.stack || error.message;
        } else {
            details = String(error);
        }
    } catch (formatError) {
        // A thrown value whose toString() itself throws must still be reported.
        details = "(unprintable error value)";
    }

    try {
        logError(scriptName, `ERROR in handler: ${details}`);
    } catch (loggingError) {
        // Last resort when logfile is unavailable, so the error is never lost.
        console.log(`[${scriptName}] ERROR in handler: ${details}`);
    }
}

// `this`, the arguments and the return value are passed through unchanged,
// so handlers relying on ev.preventDefault() or on returning a value still work.
export function safeHandler(scriptName, handler) {
    function guardedHandler(...args) {
        let result;
        try {
            result = handler.apply(this, args);
        } catch (error) {
            logHandlerError(scriptName, error);
            return undefined;
        }

        // Attach a rejection handler but return the ORIGINAL promise, so callers
        // that inspect the return value see exactly what the handler produced.
        if (result && typeof result.then === "function") {
            result.then(undefined, error => logHandlerError(scriptName, error));
        }
        return result;
    }

    return guardedHandler;
}
