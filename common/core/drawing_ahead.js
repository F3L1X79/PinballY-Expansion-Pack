// ============================================================
// Drawing ahead: runs the Add-ons' drawing work in the background, in slices
// of about 12 ms, only when no button was pressed for 400 ms and no game
// runs (see docs/adr/0005). A screen the player waits for runs in the
// foreground queue instead (docs/adr/0014). Listens to "commandbuttondown".
// - A draw blocks PinballY while it runs: it must never make the wheel stutter.
// - A step draws one thing and returns false once nothing is left.
// ============================================================

import { createPinballYHost } from "./pinbally_host.js";
import { safeHandler } from "./safe_handler.js";

const SCRIPT_NAME = "DrawingAhead";

const SLICE_MS = 12;
const BUTTON_IDLE_MS = 400;
// Between two slices, so PinballY runs its own work in between.
const PAUSE_MS = 10;
// The foreground's: longer slices, since the player waits for them, and a
// pause of about a frame, just long enough for PinballY to turn the Loader.
const FOREGROUND_SLICE_MS = 30;
const FOREGROUND_PAUSE_MS = 16;
// The foreground's first slice: a tick later, so PinballY first shows
// what the screen put up at once (its veil).
const FOREGROUND_START_MS = 1;

export function createDrawingAhead(host) {
    // Startup counts as a press: PinballY is busy loading.
    let lastPressMs = host.now().getTime();
    let timer = null;
    // The step functions, in the order they were added, each with whether
    // it may still have work.
    const works = [];
    // The foreground work, first come first served: { step, onDone, onFailed }.
    const foreground = [];

    function schedule(delayMs) {
        if (timer !== null) host.clearTimeout(timer);
        timer = host.setTimeout(safeHandler(SCRIPT_NAME, runSlice), delayMs);
    }

    // After a slice: the foreground's pause while it has work, else the
    // background's once it has some.
    function scheduleNext() {
        if (foreground.length > 0) schedule(FOREGROUND_PAUSE_MS);
        else if (works.some(work => work.awake)) schedule(PAUSE_MS);
    }

    // A step that throws sleeps until woken again, so a broken one never
    // floods the log every slice.
    function runStep(work) {
        try {
            if (!work.step()) work.awake = false;
        } catch (error) {
            work.awake = false;
            host.log(`[${SCRIPT_NAME}] ERROR in a drawing step, paused until new work: ${error.stack || error.message}`);
        }
    }

    // Removed before its callback, which may well queue new work.
    function finish(job, callback) {
        foreground.splice(foreground.indexOf(job), 1);
        safeHandler(SCRIPT_NAME, callback)();
    }

    function runForegroundStep(job) {
        let hasMore = false;
        try {
            hasMore = job.step();
        } catch (error) {
            host.log(`[${SCRIPT_NAME}] ERROR in a foreground step, its work given up: ${error.stack || error.message}`);
            finish(job, job.onFailed);
            return;
        }
        if (!hasMore) finish(job, job.onDone);
    }

    // Ignores the wait after a press and a running game: the player has
    // just asked for the screen.
    function runForegroundSlice(startMs) {
        while (foreground.length > 0) {
            runForegroundStep(foreground[0]);
            if (host.now().getTime() - startMs >= FOREGROUND_SLICE_MS) break;
        }
        scheduleNext();
    }

    function runSlice() {
        timer = null;
        const startMs = host.now().getTime();
        if (foreground.length > 0) {
            runForegroundSlice(startMs);
            return;
        }
        // A game is running exactly while PinballY reports a runMode.
        if (host.getFullUIMode().runMode !== undefined) {
            schedule(BUTTON_IDLE_MS);
            return;
        }
        const sincePressMs = startMs - lastPressMs;
        if (sincePressMs < BUTTON_IDLE_MS) {
            schedule(BUTTON_IDLE_MS - sincePressMs);
            return;
        }
        for (;;) {
            const work = works.find(candidate => candidate.awake);
            if (!work) return;
            runStep(work);
            if (host.now().getTime() - startMs >= SLICE_MS) break;
        }
        scheduleNext();
    }

    function wake(work) {
        work.awake = true;
        if (timer === null) schedule(Math.max(PAUSE_MS, lastPressMs + BUTTON_IDLE_MS - host.now().getTime()));
    }

    // Fires on every mapped button press, the list's and the wheel's alike.
    host.on("commandbuttondown", safeHandler(SCRIPT_NAME, () => {
        lastPressMs = host.now().getTime();
    }));

    return {
        // step: draws one thing and returns true, or returns false when
        // nothing is left. Returns the function that wakes it up again once
        // there is new work.
        add(step) {
            const work = { step, awake: false };
            works.push(work);
            wake(work);
            return () => wake(work);
        },
        // A screen's opening, run at once in the foreground: step as add()'s,
        // onDone() called once it returned false, onFailed() once it threw
        // (logged). Returns the function that cancels it, neither then called.
        runInForeground(step, { onDone = () => {}, onFailed = () => {} } = {}) {
            const job = { step, onDone, onFailed };
            foreground.push(job);
            // A slice already waiting for its turn starts the job too.
            if (foreground.length === 1) schedule(FOREGROUND_START_MS);
            return () => {
                const index = foreground.indexOf(job);
                if (index >= 0) foreground.splice(index, 1);
            };
        },
    };
}

let sharedDrawingAhead = null;

// One for every Add-on, so their slices never add up.
export function getDrawingAhead() {
    if (!sharedDrawingAhead) sharedDrawingAhead = createDrawingAhead(createPinballYHost());
    return sharedDrawingAhead;
}
