// ============================================================
// Backglass Clock: the time in a small borderless window in front of VPX's
// backglass while a table runs, black with a thin gold frame, redrawn when
// the minute changes. Shown on "gamestarted", gone on "gameover"; never
// during a media capture or on a single screen. Off by default.
// - Every raise keeps the window's place and never takes VPX's focus.
// - clientRect isn't in the visible window's units: only its ratio is read.
// ============================================================

import lang from "../common/core/i18n.js";
import { safeHandler } from "../common/core/safe_handler.js";
import { createPinballYHost } from "../common/core/pinbally_host.js";
import { oneLine } from "../common/drawing/steamball_drawing.js";
import { CLOCK_COLORS, clockTextOf, createMinuteTick } from "../common/clock/minute_tick.js";

const SCRIPT_NAME = "BackglassClock";

// PinballY saves and restores the window's place and size under it.
const CONFIG_VAR_PREFIX = "BackglassClock";
// VPX's B2S loads after "gamestarted" and may come in front: raised again
// on this schedule, then at each minute (as held on the cabinet, spec #369).
const RAISE_DELAYS_MS = [2000, 5000, 10000, 20000, 40000];
const LAYER_Z_INDEX = 100;
// PinballY stretches this canvas over the whole window; its width follows
// the window's aspect ratio, so the text keeps its proportions.
const CANVAS_HEIGHT = 100;
const FRAME_THICKNESS = 2;
// Between the frame and the time's ends.
const TEXT_MARGIN = 3 * FRAME_THICKNESS;
const TIME_TEXT = Object.freeze({ size: 44, minSize: 8, weight: 600, font: "Segoe UI" });
const BLACK = 0xFF000000;

export default function init() {
    const host = createPinballYHost();
    const clockWindow = host.createMediaWindow({
        title: lang.expansionPackSettings.addOns.backglassClock.name,
        configVarPrefix: CONFIG_VAR_PREFIX,
        isMediaCapturable: false,
    });
    clockWindow.setShowMediaWhenRunning(true);
    // Without it, the window opens with a Windows title bar.
    clockWindow.setBorderless(true);
    const layer = clockWindow.createDrawingLayer(LAYER_Z_INDEX);
    let raiseTimers = [];
    let shown = false;

    function draw() {
        const { width, height } = clockWindow.getClientSize();
        const ratio = width > 0 && height > 0 ? width / height : 1;
        const canvasWidth = Math.max(Math.round(CANVAS_HEIGHT * ratio), 1);
        layer.draw(dc => {
            dc.fillRect(0, 0, canvasWidth, CANVAS_HEIGHT, BLACK);
            dc.frameRect(0, 0, canvasWidth, CANVAS_HEIGHT, FRAME_THICKNESS, CLOCK_COLORS.gold);
            // The size goes down until the time fits inside the frame, never cut.
            oneLine(host, dc, clockTextOf(host.now()), {
                ...TIME_TEXT, x: TEXT_MARGIN, y: 0, width: canvasWidth - 2 * TEXT_MARGIN, height: CANVAS_HEIGHT,
                color: CLOCK_COLORS.text, align: "center", cut: false,
            });
        }, canvasWidth, CANVAS_HEIGHT);
    }

    const minuteTick = createMinuteTick(host, SCRIPT_NAME, () => {
        draw();
        clockWindow.setTopmost(true);
    });

    function clearTimers() {
        minuteTick.stop();
        for (const timer of raiseTimers) host.clearTimeout(timer);
        raiseTimers = [];
    }

    // Monitors are counted at each game, since a screen can be plugged in or out.
    host.on("gamestarted", safeHandler(SCRIPT_NAME, () => {
        clearTimers();
        if (host.countMonitors() <= 1 || host.getFullUIMode().capture) return;
        clockWindow.showWindow(true);
        shown = true;
        minuteTick.start();
        raiseTimers = RAISE_DELAYS_MS.map(delay =>
            host.setTimeout(safeHandler(SCRIPT_NAME, () => clockWindow.setTopmost(true)), delay));
    }));
    // Also fires after Exit Game.
    host.on("gameover", safeHandler(SCRIPT_NAME, () => {
        clearTimers();
        if (!shown) return;
        shown = false;
        clockWindow.showWindow(false);
        clockWindow.setTopmost(false);
    }));

    // Deferred until main.js has finished, like Force Backglass, so the hide
    // wins over PinballY's saved Visible setting for the window.
    host.setTimeout(safeHandler(SCRIPT_NAME, () => clockWindow.showWindow(false)), 0);
}
