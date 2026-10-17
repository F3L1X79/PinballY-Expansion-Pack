// ============================================================
// Hides the wheel and clears the underlay while a table is launching, to
// avoid a jarring black screen flash between the wheel view and the table's
// own loading screen, and shows the Loader with the step under way written
// in gold beneath it while the table loads and again while it closes.
// Cancels PinballY's own launch message (its text and the table's wheel
// icon). Listens to "launchoverlayshow", "launchoverlaymessage" and
// "launchoverlayhide".
// ============================================================

import { safeHandler } from "../common/core/safe_handler.js";
import { createPinballYHost } from "../common/core/pinbally_host.js";
import { createLoader, LOADER_HEIGHT } from "../common/drawing/loader.js";
import { oneLine } from "../common/drawing/steamball_drawing.js";
import { STEAMBALL_COLORS as COLORS, STEAMBALL_FONTS as FONTS } from "../common/drawing/steamball_palette.js";
import lang from "../common/core/i18n.js";

const SCRIPT_NAME = "SeamlessLaunchOverlay";

// PinballY draws the launch overlay above every layer and its own layers
// cannot be resized, so the Loader is a layer just under it, seen through
// its nearly clear background; below the menus (6000 and up), such as a
// game's pause menu. The text sits just under the comet's layer.
const LOADER_Z_INDEX = 5999;
const TEXT_Z_INDEX = 5998;

// The text's canvas, drawn one to one on a 1080-pixel-high window and
// scaled by height only elsewhere, so the layer never covers the whole
// window. Gabriola draws small for its size and has a tall line, hence a
// size above body text that still looks a little under it.
const TEXT_LOOK = Object.freeze({ width: 600, height: 60, size: 24, weight: 400, outline: 1 });
const TEXT_HEIGHT = TEXT_LOOK.height / 1080;
const TEXT_GAP = 0.01;
// The comet and the text centred together as one block (PinballY's y axis
// points up, in window heights).
const LOADER_Y = (TEXT_GAP + TEXT_HEIGHT) / 2;
const TEXT_Y = -(LOADER_HEIGHT + TEXT_GAP) / 2;
const OUTLINE_COLOR = 0xFF000000;
const OUTLINE_DIRECTIONS = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

const STEP_TEXT = lang.launchSteps;

// The step's words on one line, in light gold calligraphy, repeated first in black
// round them: PinballY's styled text has no stroke.
function drawStepText(host, dc, words) {
    const { width, height, size, weight, outline } = TEXT_LOOK;
    const line = (dx, dy, color) => oneLine(host, dc, words, {
        x: outline + dx, y: dy, width: width - 2 * outline, height, size, weight, color, font: FONTS.script, align: "center",
    });
    for (const [dx, dy] of OUTLINE_DIRECTIONS) line(dx * outline, dy * outline, OUTLINE_COLOR);
    line(0, 0, COLORS.lightGold);
}

export default function init() {
    const host = createPinballYHost();
    const loader = createLoader(host, { zIndex: LOADER_Z_INDEX, placement: LOADER_Y });
    let textLayer = null;

    // Shows the comet with the step's words beneath it, or only redraws the words.
    function show(words) {
        loader.show();
        if (!textLayer) {
            textLayer = host.createDrawingLayer(TEXT_Z_INDEX);
            textLayer.setScale({ ySpan: TEXT_HEIGHT });
            textLayer.setPos(0, TEXT_Y);
        }
        textLayer.draw(dc => drawStepText(host, dc, words), TEXT_LOOK.width, TEXT_LOOK.height);
    }

    // Removes the words' layer rather than hiding it, so an idle launch
    // costs nothing per frame.
    function hide() {
        loader.hide();
        if (!textLayer) return;
        host.removeDrawingLayer(textLayer);
        textLayer = null;
    }

    // Fires when the launch overlay appears: hides the wheel and replaces the
    // default overlay background (preventDefault suppresses PinballY's own).
    host.on("launchoverlayshow", safeHandler(SCRIPT_NAME, ev => {
        host.showWheel(false);
        host.setUnderlay("");
        host.getLaunchOverlayBackground().clear(0x20FF00FF);
        ev.preventDefault();
        show(STEP_TEXT.loading);
    }));

    // Fires at each step of a launch; preventDefault suppresses PinballY's
    // text and the table's wheel icon. The overlay stays up while the game
    // runs, so the comet and its words stop once the game plays and come
    // back while it closes, unchanged until the overlay goes; a launch that
    // never plays keeps them until then. A capture is named only while the
    // comet shows, never over a game being played.
    host.on("launchoverlaymessage", safeHandler(SCRIPT_NAME, ev => {
        ev.preventDefault();
        if (ev.id === "running") hide();
        if (ev.id === "terminating") show(STEP_TEXT.closing);
        if (ev.id === "capturing" && textLayer) show(STEP_TEXT.capturing);
    }));

    host.on("launchoverlayhide", safeHandler(SCRIPT_NAME, () => {
        host.showWheel(true);
        hide();
    }));
}
