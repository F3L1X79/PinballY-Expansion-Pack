// ============================================================
// Window watch: while a screen is open, reads the main window's view size
// about every 100 ms and tells the screen when it changed. PinballY gives
// its window its final size only after the scripts' init and tells no
// script, so a screen opened at startup is laid out for a smaller window.
// - Started on opening and stopped on closing: never left running between screens.
// - A view size that cannot be read leaves the screen unwatched, never unshown.
// ============================================================

import { safeHandler } from "./safe_handler.js";
import { logError } from "./error_log.js";

export const WINDOW_WATCH_MS = 100;
const MAX_RETRIES = 10;

const sameSize = (a, b) => a.width === b.width && a.height === b.height;

export function createWindowWatch(host, scriptName) {
    let timer = null;
    // The view size the screen follows: the one it was last laid out for.
    let followedSize = null;

    function stop() {
        if (timer !== null) host.clearInterval(timer);
        timer = null;
    }

    // onChange(previous, next): view sizes as { width, height }. It returns
    // false when the screen could not follow yet (its layers not resized
    // with the view): the watch tells it again on the next ticks.
    function start(onChange) {
        stop();
        try {
            followedSize = host.getViewSize();
        } catch (error) {
            logError(scriptName, `ERROR reading the window's size, the screen won't follow it: ${error.stack || error.message}`, host);
            return;
        }
        let retries = 0;
        timer = host.setInterval(safeHandler(scriptName, () => {
            const next = host.getViewSize();
            if (sameSize(next, followedSize)) return;
            // Each try measures the whole window: given up after about a second.
            if (onChange(followedSize, next) === false && ++retries < MAX_RETRIES) return;
            followedSize = next;
            retries = 0;
        }), WINDOW_WATCH_MS);
    }

    return { start, stop };
}
