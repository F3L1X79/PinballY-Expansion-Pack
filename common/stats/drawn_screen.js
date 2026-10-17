// ============================================================
// Drawn screen: the layer plumbing the Profile Stats and the Household
// Stats share. Each piece goes on its own hidden layer placed in reference
// pixels, after the backdrop, which measures the window; the layers fade in
// together on the clock and are all removed on close. openDrawnScreen()
// draws them all at once; prepareDrawnScreen() is the shared opening of a
// screen the player waits for (docs/adr/0014): the wheel dims at once under
// a veil, the reading and drawing steps run in the drawing ahead's
// foreground queue, the Loader turns over the veil if they last more than
// 150 ms, then goes before the fade in, the veil once it is over. Logs each
// such opening's time, reading and drawing apart. Listens to no event and
// writes nothing.
// ============================================================

import { safeHandler } from "../core/safe_handler.js";
import { STEAMBALL_COLORS } from "../drawing/steamball_palette.js";
import { DIMMED_WHEEL } from "../drawing/steamball_drawing.js";
import { createLoader } from "../drawing/loader.js";

const FADE_MS = 220;
export const FRAME_MS = 16;
// A screen ready sooner shows no Loader: no flash of comet on a fast cabinet.
const LOADER_DELAY_MS = 150;

// The layers, their placing and fade in, shared by both openings.
function createScreenLayers(host, scriptName, referenceHeight) {
    const layers = [];
    let referenceWidth = 0;
    let fadeTimer = null;

    function hiddenLayer(zIndex) {
        const layer = host.createDrawingLayer(zIndex);
        layer.alpha = 0;
        layer.clear(STEAMBALL_COLORS.transparent);
        return layer;
    }

    // rect in reference pixels, from the window's top left.
    function place(layer, rect) {
        layer.setScale({ ySpan: rect.h / referenceHeight });
        layer.setPos((rect.x + rect.w / 2) / referenceWidth - 0.5, 0.5 - (rect.y + rect.h / 2) / referenceHeight);
    }

    function stopFade() {
        host.clearInterval(fadeTimer);
        fadeTimer = null;
    }

    return {
        layers,
        place,
        // Known once the backdrop is drawn: PinballY draws a layer within draw().
        get referenceWidth() { return referenceWidth; },
        // drawBackdrop(dc, size, referenceWidth): dims the wheel behind the panel.
        drawBackdrop(zIndex, drawBackdrop) {
            const backdrop = hiddenLayer(zIndex);
            backdrop.draw(dc => {
                const size = dc.getSize();
                referenceWidth = referenceHeight * size.width / size.height;
                drawBackdrop(dc, size, referenceWidth);
            });
            layers.unshift(backdrop);
        },
        // A hidden layer placed on rect and drawn in its own coordinates,
        // canvas.w by canvas.h (rect's size by default, another one
        // stretched to rect), kept in into (the screen's layers by default).
        drawPiece(zIndex, rect, draw, into = layers, canvas = rect) {
            const layer = hiddenLayer(zIndex);
            place(layer, rect);
            layer.draw(draw, canvas.w, canvas.h);
            into.push(layer);
            return layer;
        },
        // setOpacity(opacity) every frame, from 0 to 1, then onFaded();
        // timed on the clock, since Windows timers fire late.
        fadeIn(setOpacity, onFaded = () => {}) {
            const startMs = host.now().getTime();
            fadeTimer = host.setInterval(safeHandler(scriptName, () => {
                const opacity = Math.min(1, (host.now().getTime() - startMs) / FADE_MS);
                setOpacity(opacity);
                if (opacity < 1) return;
                stopFade();
                onFaded();
            }), FRAME_MS);
        },
        // Removes the layers, those of other included; safe to call again.
        close(other = []) {
            stopFade();
            for (const layer of [...layers, ...other]) host.removeDrawingLayer(layer);
            layers.length = 0;
            other.length = 0;
        },
    };
}

// referenceHeight: the window's height in reference pixels;
// drawBackdrop(dc, size, referenceWidth): dims the wheel behind the panel.
// Draws the backdrop at once; the screen draws its pieces at once too.
export function openDrawnScreen(host, scriptName, { referenceHeight, backdropZIndex, drawBackdrop }) {
    const screen = createScreenLayers(host, scriptName, referenceHeight);
    screen.drawBackdrop(backdropZIndex, drawBackdrop);
    return screen;
}

// The shared opening of a screen the player waits for. referenceHeight:
// the window's height in reference pixels; drawingAhead: the shared drawing
// ahead (common/core/drawing_ahead.js). The screen queues its steps with
// read(step) and draw(step), each doing one thing (a step may queue more),
// draws within them with drawBackdrop(draw) and drawPiece(), then calls
// start(). The veil and Loader sit just under the backdrop.
export function prepareDrawnScreen(host, scriptName, { referenceHeight, backdropZIndex, drawingAhead }) {
    const screen = createScreenLayers(host, scriptName, referenceHeight);
    const loader = createLoader(host, { zIndex: backdropZIndex - 1 });
    // Each step with whether it reads or draws, first come first run.
    const steps = [];
    const spentMs = { read: 0, draw: 0 };
    let veil = null;
    let loaderTimer = null;
    let cancel = null;

    function stopLoader() {
        host.clearTimeout(loaderTimer);
        loaderTimer = null;
        loader.hide();
    }

    function removeVeil() {
        if (!veil) return;
        host.removeDrawingLayer(veil);
        veil = null;
    }

    // Gives up the opening or closes the open screen: the veil, the Loader
    // and the layers go, those of other included; safe to call again.
    function close(other = []) {
        if (cancel) cancel();
        cancel = null;
        stopLoader();
        removeVeil();
        screen.close(other);
    }

    // One step of the foreground queue: the next one, timed by its kind.
    function runNextStep() {
        const { kind, step } = steps.shift();
        const startMs = host.now().getTime();
        step();
        spentMs[kind] += host.now().getTime() - startMs;
        return steps.length > 0;
    }

    return {
        layers: screen.layers,
        place: screen.place,
        get referenceWidth() { return screen.referenceWidth; },
        drawBackdrop: draw => screen.drawBackdrop(backdropZIndex, draw),
        drawPiece: screen.drawPiece,
        read(step) { steps.push({ kind: "read", step }); },
        draw(step) { steps.push({ kind: "draw", step }); },
        // Dims the wheel at once and runs the steps; once they are over,
        // onReady() (the screen set up, still hidden), then the fade in
        // through setOpacity(opacity). onFailed(): a step threw (logged)
        // and the opening is given up, everything already removed.
        start({ onReady, setOpacity, onFailed }) {
            const openedAt = host.now().getTime();
            // Cleared, not drawn: nothing to measure, so it shows at once.
            veil = host.createDrawingLayer(backdropZIndex - 2);
            veil.clear(DIMMED_WHEEL);
            loaderTimer = host.setTimeout(safeHandler(scriptName, () => {
                loaderTimer = null;
                loader.show();
            }), LOADER_DELAY_MS);
            const onDone = () => {
                cancel = null;
                const readyAt = host.now().getTime();
                host.log(`[${scriptName}] Opened in ${readyAt - openedAt} ms: read in ${spentMs.read} ms, drawn in ${spentMs.draw} ms.`);
                stopLoader();
                onReady();
                screen.fadeIn(setOpacity, removeVeil);
            };
            cancel = drawingAhead.runInForeground(runNextStep, { onDone, onFailed: () => {
                cancel = null;
                close();
                onFailed();
            } });
        },
        close,
    };
}
