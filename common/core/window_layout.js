// ============================================================
// Window layout: PinballY gives its main window its final size only after the
// scripts' init and tells no script. Created during the init, it reads the
// view's size then; the window is laid out once that size changes, or after
// LAYOUT_FALLBACK_MS when it never does (a window already in place). Logs both.
// - Created by main.js before any Add-on: created later, the size it reads is already the final one.
// - A view size that cannot be read counts as laid out: nothing ever waits on it.
// ============================================================

import { safeHandler } from "./safe_handler.js";
import { createPinballYHost } from "./pinbally_host.js";
import { readViewSize, sameSize, sizeText, WINDOW_WATCH_MS } from "./window_watch.js";

const SCRIPT_NAME = "WindowLayout";

export const LAYOUT_FALLBACK_MS = 2000;

export function createWindowLayout(host) {
    const initSize = readViewSize(host, SCRIPT_NAME);
    let isDone = initSize === null;
    const listeners = new Set();
    let timer = null;
    // When something first waited: the fallback counts from there.
    let waitStartMs = null;

    function finish(message) {
        isDone = true;
        if (timer !== null) host.clearInterval(timer);
        timer = null;
        host.log(`[${SCRIPT_NAME}] ${message}`);
        const waiting = [...listeners];
        listeners.clear();
        for (const listener of waiting) listener();
    }

    function check() {
        const size = readViewSize(host, SCRIPT_NAME);
        const waitedMs = host.now().getTime() - waitStartMs;
        if (size === null || !sameSize(size, initSize)) finish(`Laid out ${waitedMs} ms after the first wait: view ${sizeText(initSize)} to ${size === null ? "unreadable" : sizeText(size)}.`);
        else if (waitedMs >= LAYOUT_FALLBACK_MS) finish(`Still ${sizeText(initSize)} after ${waitedMs} ms: taken as laid out.`);
    }

    // The first call starts the wait the fallback counts from.
    function isLaidOut() {
        if (isDone) return true;
        if (waitStartMs === null) waitStartMs = host.now().getTime();
        check();
        return isDone;
    }

    // listener: runs once the window is laid out, at once if it already is;
    // the same listener waiting twice runs once.
    function whenLaidOut(listener) {
        if (isLaidOut()) {
            listener();
            return;
        }
        listeners.add(listener);
        if (timer === null) timer = host.setInterval(safeHandler(SCRIPT_NAME, check), WINDOW_WATCH_MS);
    }

    return { isLaidOut, whenLaidOut };
}

// Laid out from the start: for a queue created without main.js (tests).
export const ALWAYS_LAID_OUT = Object.freeze({ isLaidOut: () => true, whenLaidOut: listener => listener() });

let sharedWindowLayout = null;

export function getWindowLayout() {
    if (!sharedWindowLayout) sharedWindowLayout = createWindowLayout(createPinballYHost());
    return sharedWindowLayout;
}
