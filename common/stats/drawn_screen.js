// ============================================================
// Drawn screen: the layer plumbing the Profile Stats, the Household Stats
// and the High Score Board share: hidden layers placed in reference pixels
// after the backdrop (which measures the window), faded in together and
// removed on close; a prepared screen can also be set aside (hidden while
// a child screen is open) and shown again at once. openDrawnScreen() draws
// at once; prepareDrawnScreen() goes through the shared screen opening
// (docs/adr/0014). Writes nothing.
// ============================================================

import { STEAMBALL_COLORS } from "../drawing/steamball_palette.js";
import { createScreenOpening, fadeIn, FRAME_MS } from "../drawing/screen_opening.js";

export { FRAME_MS };

// A hidden layer is reduced to a point: PinballY otherwise stretches it to
// the whole window and fills every pixel of it each frame, even invisible.
const HIDDEN_SPAN = { xSpan: 0.001, ySpan: 0.001 };
// PinballY's default span, the backdrop's: the whole window.
const WINDOW_SPAN = { xSpan: 1, ySpan: 1 };

// The layers, their placing and fade in, shared by both openings.
function createScreenLayers(host, scriptName, referenceHeight) {
    const layers = [];
    // Each placed layer's rect, to put it back once shown again.
    const rects = new Map();
    let referenceWidth = 0;
    let stopFade = () => {};

    function hiddenLayer(zIndex) {
        const layer = host.createDrawingLayer(zIndex);
        layer.alpha = 0;
        layer.clear(STEAMBALL_COLORS.transparent);
        return layer;
    }

    // rect in reference pixels, from the window's top left.
    function place(layer, rect) {
        rects.set(layer, rect);
        layer.setScale({ ySpan: rect.h / referenceHeight });
        layer.setPos((rect.x + rect.w / 2) / referenceWidth - 0.5, 0.5 - (rect.y + rect.h / 2) / referenceHeight);
    }

    return {
        layers,
        place,
        // Known once the backdrop is drawn: PinballY draws a layer within draw().
        get referenceWidth() { return referenceWidth; },
        // drawBackdrop(dc, size, referenceWidth): dims the wheel behind the panel.
        drawBackdrop(zIndex, drawBackdrop) {
            const backdrop = hiddenLayer(zIndex);
            // Kept before drawing, so a draw that throws leaves nothing behind once closed.
            layers.unshift(backdrop);
            backdrop.draw(dc => {
                const size = dc.getSize();
                referenceWidth = referenceHeight * size.width / size.height;
                drawBackdrop(dc, size, referenceWidth);
            });
        },
        // A hidden layer placed on rect and drawn in its own coordinates,
        // canvas.w by canvas.h (rect's size by default, another one
        // stretched to rect), kept in into (the screen's layers by default).
        drawPiece(zIndex, rect, draw, into = layers, canvas = rect) {
            const layer = hiddenLayer(zIndex);
            into.push(layer);
            place(layer, rect);
            layer.draw(draw, canvas.w, canvas.h);
            return layer;
        },
        // setOpacity(opacity) every frame, from 0 to 1, then onFaded().
        fadeIn(setOpacity, onFaded) {
            stopFade = fadeIn(host, scriptName, setOpacity, onFaded);
        },
        // Every layer hidden and reduced to a point, those of other included.
        setAside(other = []) {
            stopFade();
            for (const layer of [...layers, ...other]) {
                layer.alpha = 0;
                layer.setScale(HIDDEN_SPAN);
            }
        },
        // Every layer back in its place, then setOpacity(1): the screen
        // decides which layers show, and must place again those it set
        // aside apart (other), which stay reduced to a point until then.
        showAgain(setOpacity) {
            for (const layer of layers) {
                if (rects.has(layer)) place(layer, rects.get(layer));
                else layer.setScale(WINDOW_SPAN);
            }
            setOpacity(1);
        },
        // Removes the layers, those of other included; safe to call again.
        close(other = []) {
            stopFade();
            for (const layer of [...layers, ...other]) host.removeDrawingLayer(layer);
            layers.length = 0;
            other.length = 0;
            rects.clear();
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
// ahead (common/core/drawing_ahead.js); profileName and isReadOnly: whose
// screen the timing line names (common/drawing/screen_opening.js). The
// screen queues its steps with read(step) and draw(step), each doing one
// thing (a step may queue more), draws within them with drawBackdrop(draw)
// and drawPiece(), then calls start(). The veil and Loader sit just under
// the backdrop.
export function prepareDrawnScreen(host, scriptName, { referenceHeight, backdropZIndex, drawingAhead, profileName = null, isReadOnly = false }) {
    const screen = createScreenLayers(host, scriptName, referenceHeight);
    const opening = createScreenOpening(host, scriptName, { zIndex: backdropZIndex - 2, drawingAhead });
    // Each step with whether it reads or draws, first come first run.
    const steps = [];

    // Gives up the opening or closes the open screen: the veil, the Loader
    // and the layers go, those of other included; safe to call again.
    function close(other = []) {
        opening.remove();
        screen.close(other);
    }

    // One step of the foreground queue: the next one, timed by its kind.
    function runNextStep() {
        const { kind, step } = steps.shift();
        opening[kind](step);
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
        // Once ready: hidden while a child screen is open, the veil and the
        // fade in gone.
        setAside(other = []) {
            opening.remove();
            screen.setAside(other);
        },
        // At once, without a veil, a fade in nor an opening time line.
        showAgain: screen.showAgain,
        // Dims the wheel at once and runs the steps; once they are over,
        // onReady() (the screen set up, still hidden), then the fade in
        // through setOpacity(opacity). onFailed(): a step threw (logged)
        // and the opening is given up, everything already removed.
        start({ onReady, setOpacity, onFailed }) {
            opening.begin();
            opening.runVeiled(runNextStep, {
                onDone: () => {
                    opening.logOpened({ profileName, isReadOnly });
                    onReady();
                    opening.fadeIn(setOpacity);
                },
                onFailed: () => {
                    close();
                    onFailed();
                },
            });
        },
        close,
    };
}
