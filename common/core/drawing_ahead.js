// ============================================================
// Drawing ahead: runs the add-ons' drawing work in the background, in
// slices of about 12 ms, only once no button has been pressed for 400 ms
// and no game is running (see docs/adr/0005): a draw blocks PinballY while
// it runs, so it must never make the wheel stutter or slow a game down.
// Each piece of work is a step function that draws one thing and returns
// false once nothing is left; it sleeps until woken again.
// Listens to "commandbuttondown" to note the last button press.
// ============================================================

import { createPinballYHost } from "./pinbally_host.js";
import { safeHandler } from "./safe_handler.js";

const SCRIPT_NAME = "DrawingAhead";

const SLICE_MS = 12;
const BUTTON_IDLE_MS = 400;
// Between two slices, so PinballY runs its own work in between.
const PAUSE_MS = 10;

export function createDrawingAhead(host) {
    // Startup counts as a press: PinballY is busy loading.
    let lastPressMs = host.now().getTime();
    let timer = null;
    // The step functions, in the order they were added, each with whether
    // it may still have work.
    const works = [];

    function schedule(delayMs) {
        if (timer !== null) host.clearTimeout(timer);
        timer = host.setTimeout(safeHandler(SCRIPT_NAME, runSlice), Math.max(PAUSE_MS, delayMs));
    }

    // A step that throws sleeps until woken again, so a broken one never
    // floods the log every slice.
    function runStep(work) {
        try {
            if (!work.step()) work.awake = false;
        } catch (error) {
            work.awake = false;
            host.log(`[${SCRIPT_NAME}] A drawing step failed, paused until new work: ${error.stack || error.message}`);
        }
    }

    function runSlice() {
        timer = null;
        const startMs = host.now().getTime();
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
        if (works.some(work => work.awake)) schedule(PAUSE_MS);
    }

    function wake(work) {
        work.awake = true;
        if (timer === null) schedule(lastPressMs + BUTTON_IDLE_MS - host.now().getTime());
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
    };
}

let sharedDrawingAhead = null;

// One for every Add-on, so their slices never add up.
export function getDrawingAhead() {
    if (!sharedDrawingAhead) sharedDrawingAhead = createDrawingAhead(createPinballYHost());
    return sharedDrawingAhead;
}
