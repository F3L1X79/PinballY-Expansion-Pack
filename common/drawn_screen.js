// ============================================================
// Drawn screen: the layer plumbing the Profile Stats and the Household
// Stats share. openDrawnScreen() draws the backdrop first, which measures
// the window, then each piece on its own hidden layer placed in reference
// pixels; it fades them in together on the clock and removes them all on
// close. Listens to no event and writes nothing.
// ============================================================

import { safeHandler } from "./safe_handler.js";
import { STEAMBALL_COLORS } from "./steamball_palette.js";

const FADE_MS = 220;
export const FRAME_MS = 16;

// referenceHeight: the window's height in reference pixels;
// drawBackdrop(dc, size, referenceWidth): dims the wheel behind the panel.
export function openDrawnScreen(host, scriptName, { referenceHeight, backdropZIndex, drawBackdrop }) {
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

    const backdrop = hiddenLayer(backdropZIndex);
    backdrop.draw(dc => {
        const size = dc.getSize();
        referenceWidth = referenceHeight * size.width / size.height;
        drawBackdrop(dc, size, referenceWidth);
    });
    layers.push(backdrop);

    return {
        // Known already: PinballY draws a layer within draw().
        referenceWidth,
        // Every layer of the screen, the backdrop first.
        layers,
        place,
        // A hidden layer placed on rect and drawn in its own coordinates,
        // kept in into (the screen's layers by default).
        drawPiece(zIndex, rect, draw, into = layers) {
            const layer = hiddenLayer(zIndex);
            place(layer, rect);
            layer.draw(draw, rect.w, rect.h);
            into.push(layer);
            return layer;
        },
        // setOpacity(opacity) every frame, from 0 to 1; timed on the clock,
        // since Windows timers fire late.
        fadeIn(setOpacity) {
            const startMs = host.now().getTime();
            fadeTimer = host.setInterval(safeHandler(scriptName, () => {
                const opacity = Math.min(1, (host.now().getTime() - startMs) / FADE_MS);
                setOpacity(opacity);
                if (opacity >= 1) stopFade();
            }), FRAME_MS);
        },
        // Removes the layers, those of other included.
        close(other = []) {
            stopFade();
            for (const layer of [...layers, ...other]) host.removeDrawingLayer(layer);
        },
    };
}
