// ============================================================
// Reads the drawn Welcome Screen the way the player sees it, on the fake
// PinballY host: whether it is open, its greeting, its bottom row's
// labels, the highlighted choice (the label under the gold halo, or the
// tooltip of the Avatar or the cross), and picks a choice with Next and
// Select as a player would.
// Never loaded by PinballY.
// ============================================================

import assert from "node:assert/strict";
import { WELCOME_SCREEN_Z_INDEX } from "../common/welcome_screen_painter.js";

// The startup pause: the screen is drawn then, and starts fading in.
export const WELCOME_SCREEN_PAUSE_MS = 500;
// Past the startup pause and the fade.
export const WELCOME_SCREEN_OPEN_MS = 1000;

export const press = (fake, buttonCommand) => fake.fire("commandbuttondown", { command: buttonCommand, repeat: false });

const shownLayers = (fake, zIndex) => fake.drawingLayers().filter(layer => layer.zIndex === zIndex && layer.alpha > 0);

export const isWelcomeScreenOpen = fake => shownLayers(fake, WELCOME_SCREEN_Z_INDEX.backdrop).length > 0;

// Its layers, shown or not: none once it closed.
export const welcomeScreenLayerCount = fake => fake.drawingLayers()
    .filter(layer => Object.values(WELCOME_SCREEN_Z_INDEX).includes(layer.zIndex)).length;

// The greeting, its runs joined; null when the screen is closed.
export function greeting(fake) {
    const header = shownLayers(fake, WELCOME_SCREEN_Z_INDEX.header);
    return header.length > 0 ? header.flatMap(layer => layer.texts()).join("") : null;
}

// Whether the header shows the active Profile's Avatar.
export const headerImages = fake => shownLayers(fake, WELCOME_SCREEN_Z_INDEX.header).flatMap(layer => layer.images());

// The bottom row's labels, from left to right, without the mystery box
// icon's "?".
export const bottomRowLabels = fake => shownLayers(fake, WELCOME_SCREEN_Z_INDEX.rows)
    .flatMap(layer => layer.texts())
    .filter(text => text !== "?");

// A point of a layer's canvas, in window pixels: PinballY scales the
// canvas to ySpan of the window's height, keeping its aspect, centred on
// its position (-0.5 to 0.5 across, upward).
function toWindow(layer, window, x, y) {
    const canvas = layer.canvasSize();
    const factor = layer.scale().ySpan * window.height / canvas.height;
    const center = { x: (layer.position().x + 0.5) * window.width, y: (0.5 - layer.position().y) * window.height };
    return { x: center.x + (x - canvas.width / 2) * factor, y: center.y + (y - canvas.height / 2) * factor };
}

// The text drawn under that window point, on the screen's other layers.
function textAt(fake, window, point) {
    for (const zIndex of [WELCOME_SCREEN_Z_INDEX.header, WELCOME_SCREEN_Z_INDEX.rows]) {
        for (const layer of shownLayers(fake, zIndex)) {
            for (const { text, rect } of layer.strokes().filter(stroke => "text" in stroke)) {
                const from = toWindow(layer, window, rect.x, rect.y);
                const to = toWindow(layer, window, rect.x + rect.width, rect.y + rect.height);
                if (point.x >= from.x && point.x <= to.x && point.y >= from.y && point.y <= to.y) return text;
            }
        }
    }
    return null;
}

// The highlighted choice: { label, tooltip }, label being the text under
// the halo (null for the Avatar and the cross, which show a tooltip).
export function highlighted(fake) {
    const lit = shownLayers(fake, WELCOME_SCREEN_Z_INDEX.highlights);
    assert.equal(lit.length, 1, "exactly one choice is highlighted");
    const [layer] = lit;
    const tooltip = layer.texts()[0] || null;
    if (tooltip) return { label: null, tooltip };
    const [backdrop] = shownLayers(fake, WELCOME_SCREEN_Z_INDEX.backdrop);
    const window = backdrop.canvasSize();
    const canvas = layer.canvasSize();
    return { label: textAt(fake, window, toWindow(layer, window, canvas.width / 2, canvas.height / 2)), tooltip: null };
}

// The label or tooltip of the highlighted choice.
const highlightedName = fake => {
    const { label, tooltip } = highlighted(fake);
    return label || tooltip;
};

// The names of every choice, in the order Next walks them from the
// highlighted one, which comes back highlighted.
export function readChoices(fake) {
    const names = [highlightedName(fake)];
    for (let guard = 0; guard < 20; guard++) {
        press(fake, "Next");
        const name = highlightedName(fake);
        if (name === names[0]) return names;
        names.push(name);
    }
    throw new Error("The highlight never came back to where it was.");
}

// Moves the highlight with Next to the choice with this label or tooltip,
// then presses Select.
export function choose(fake, name) {
    for (let guard = 0; guard < 20 && highlightedName(fake) !== name; guard++) press(fake, "Next");
    assert.equal(highlightedName(fake), name, `the Welcome Screen offers "${name}"`);
    return press(fake, "Select");
}
