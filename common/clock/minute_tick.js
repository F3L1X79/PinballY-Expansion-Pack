// ============================================================
// The clocks' shared minute tick and look: the wheel's Clock and the
// Backglass Clock redraw when the minute changes, in the same text and
// colours. No side effects on import; a tick runs only once started.
// ============================================================

import lang from "../core/i18n.js";
import { safeHandler } from "../core/safe_handler.js";

// Soft white, opaque, and the gold of the wheel clock's underline.
export const CLOCK_COLORS = Object.freeze({ text: 0xFFDCDCDC, gold: 0xFFE8B84A });

// The time in the language's format, without seconds or date.
export const clockTextOf = date => lang.clock.time(date.getHours(), date.getMinutes());

// onMinute runs at start(), then right when each next minute starts; each
// wait is measured afresh, so the tick never drifts.
export function createMinuteTick(host, scriptName, onMinute) {
    let timer = null;

    function stop() {
        host.clearTimeout(timer);
        timer = null;
    }

    function tick() {
        onMinute();
        const now = host.now();
        const msToNextMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
        stop();
        timer = host.setTimeout(safeHandler(scriptName, tick), msToNextMinute);
    }

    return { start: tick, stop };
}
