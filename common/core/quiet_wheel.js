// ============================================================
// Quiet wheel: while a screen dims the wheel (the startup veil, the Profile
// picker, the Welcome Screen), the selected table's own audioVolume is brought
// down to 50 with a single update(); it comes back when the last of them
// closes, at once if a launch, a menu or attract mode cuts the hand-over
// (docs/adr/0015).
// - One update() each way, never a fade: every update() flashes the wheel.
// - The return finds the table by config ID: the selection may have moved since.
// ============================================================

import { safeHandler } from "./safe_handler.js";
import { createPinballYHost } from "./pinbally_host.js";

const SCRIPT_NAME = "QuietWheel";
// Half the recorded level; a table set at or below it is left alone.
const QUIET_CEILING = 50;
// A screen that follows another holds the wheel again within this delay:
// no rise between them.
const HANDOVER_MS = 150;

// hold() and release() are safe to call again with the same name.
export function createQuietWheel(host) {
    // Names of the screens dimming the wheel.
    const holders = new Set();
    // { configId, title, original, quiet } while a table is lowered, else null.
    let loweredTable = null;
    let handoverTimer = null;

    const log = message => host.log(`[${SCRIPT_NAME}] ${message}`);

    function clearHandover() {
        host.clearTimeout(handoverTimer);
        handoverTimer = null;
    }

    function lower() {
        if (loweredTable) return;
        const game = host.getCurrentTable();
        if (!game) {
            log("No table selected, nothing lowered.");
            return;
        }
        const original = game.audioVolume;
        const quiet = Math.min(original, QUIET_CEILING);
        // Kept even when untouched, so later holds don't look at it again.
        loweredTable = { configId: game.configId, title: game.title, original, quiet };
        if (quiet === original) {
            log(`Left "${game.title}" at ${original}, already quiet.`);
            return;
        }
        game.update({ audioVolume: quiet });
        log(`Lowered "${game.title}" from ${original} to ${quiet} (${[...holders].join(", ")}).`);
    }

    function restore(why) {
        clearHandover();
        if (!loweredTable) return;
        const { configId, title, original, quiet } = loweredTable;
        loweredTable = null;
        if (quiet === original) return;
        const game = host.getGameInfo(configId);
        if (!game) {
            log(`"${title}" (${configId}) is no longer in the game list, its volume left at ${quiet}.`);
            return;
        }
        game.update({ audioVolume: original });
        log(`Restored "${title}" from ${quiet} to ${original} (${why}).`);
    }

    function hold(name) {
        clearHandover();
        holders.add(name);
        lower();
    }

    // atOnce: no hand-over, for a screen that closes with nothing to follow
    // it (a launch, a wheel move, a menu): the table is back at once.
    function release(name, { atOnce = false } = {}) {
        if (!holders.delete(name) || holders.size > 0) return;
        if (atOnce) {
            restore(`${name} closed`);
            return;
        }
        clearHandover();
        handoverTimer = host.setTimeout(safeHandler(SCRIPT_NAME, () => {
            handoverTimer = null;
            if (holders.size === 0) restore(`${name} closed`);
        }), HANDOVER_MS);
    }

    // Fire when a table starts launching, a menu opens or the cabinet sits
    // idle: no screen follows any more, so a hand-over ends at once.
    const endHandover = safeHandler(SCRIPT_NAME, ev => {
        if (handoverTimer !== null) restore(`${ev.type} in the hand-over`);
    });
    for (const type of ["launchoverlayshow", "menuopen", "attractmodestart"]) host.on(type, endHandover);

    return {
        hold: safeHandler(SCRIPT_NAME, hold),
        release: safeHandler(SCRIPT_NAME, release),
    };
}

let sharedQuietWheel = null;

export function getQuietWheel() {
    if (!sharedQuietWheel) sharedQuietWheel = createQuietWheel(createPinballYHost());
    return sharedQuietWheel;
}
