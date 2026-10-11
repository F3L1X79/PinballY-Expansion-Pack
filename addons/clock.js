// ============================================================
// Clock: the time at the top left of the wheel screen, facing the active
// Profile's badge, in the language's format, soft white with a drop shadow
// and a gold underline as wide as the time. Redrawn when the minute
// changes; hidden on "gamestarted", shown again (on time) on "wheelmode".
// ============================================================

import lang from "../common/core/i18n.js";
import { safeHandler } from "../common/core/safe_handler.js";
import { createPinballYHost } from "../common/core/pinbally_host.js";
import { drawShadowedText } from "../common/drawing/shadowed_text.js";

const SCRIPT_NAME = "Clock";

// Like the badge: above the wheel and the game info box, under popups and menus.
const CLOCK_Z_INDEX = 4500;
// Its own canvas pinned to the top left corner, for the same reason as the
// badge: a canvas drawn at startup, before the window is laid out, would
// be stretched out of shape. Sizes are the badge's scale, on the cabinet's
// 1920 px high playfield; the text's top lines up with the badge's Avatar.
const CLOCK = Object.freeze({ width: 260, height: 110, left: 30, top: 30 });
const CLOCK_REFERENCE_HEIGHT = 1920;
const TIME_TEXT = Object.freeze({ size: 28, weight: 600 });
const UNDERLINE = Object.freeze({ thickness: 2, gap: 4 });
// Soft white, opaque: a translucent text would show its own shadow through it.
const COLORS = Object.freeze({ text: 0xFFDCDCDC, gold: 0xFFE8B84A, transparent: 0x00000000 });

export default function init() {
    const host = createPinballYHost();
    const layer = host.createDrawingLayer(CLOCK_Z_INDEX);
    layer.setScale({ ySpan: CLOCK.height / CLOCK_REFERENCE_HEIGHT });
    layer.setPos(0, 0, "top left");
    let minuteTimer = null;

    function draw() {
        const now = host.now();
        layer.clear(COLORS.transparent);
        layer.draw(dc => {
            const { left, top, width } = CLOCK;
            const text = lang.clock.time(now.getHours(), now.getMinutes());
            const measured = drawShadowedText(host, dc, TIME_TEXT, COLORS.text, text, top,
                { x: left, width: width - left, align: "left" });
            const underlineY = top + measured.height + UNDERLINE.gap;
            dc.fillRect(left, underlineY, Math.round(measured.width), UNDERLINE.thickness, COLORS.gold);
        }, CLOCK.width, CLOCK.height);
    }

    // Redraws now, then again right when the next minute starts; each wait
    // is measured afresh, so the clock never drifts.
    function tick() {
        draw();
        const now = host.now();
        const msToNextMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
        host.clearTimeout(minuteTimer);
        minuteTimer = host.setTimeout(safeHandler(SCRIPT_NAME, tick), msToNextMinute);
    }

    // Never over a game, and no redraw while it is hidden.
    host.on("gamestarted", safeHandler(SCRIPT_NAME, () => {
        layer.alpha = 0;
        host.clearTimeout(minuteTimer);
        minuteTimer = null;
    }));
    // Fires back on the wheel, after a game, a menu or a dialog: PinballY
    // may not have run timers while the game had the screen.
    host.on("wheelmode", safeHandler(SCRIPT_NAME, () => {
        layer.alpha = 1;
        tick();
    }));

    tick();
}
