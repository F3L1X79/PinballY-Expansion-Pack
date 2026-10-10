// ============================================================
// Reads the Drawn Menu the way the player sees it, on the fake PinballY
// host: whether one is shown, its message, its rows from top to bottom
// (an entry with its title and its gold mark, a heading or a separator),
// the highlighted entry (the one written in gold on the selection), and
// helpers to open a menu, press buttons and choose an entry by its
// title, letting the fade in and the glide end.
// Never loaded by PinballY.
// ============================================================

import { DRAWN_MENU_Z_INDEX, DRAWN_MENU_LOOK, DRAWN_MENU_MARKS } from "../common/drawn_menu_painter.js";

// Past the fade in, and past the glide from one entry to the next.
export const OPEN_OVER_MS = 300;
export const GLIDE_OVER_MS = 400;

const { colors: COLORS } = DRAWN_MENU_LOOK;
const MARK_NAMES = new Map(Object.entries(DRAWN_MENU_MARKS).map(([name, glyph]) => [glyph, name]));

const shownLayers = (fake, zIndex) => fake.drawingLayers().filter(layer => layer.zIndex === zIndex && layer.alpha > 0);
const textsLayer = fake => shownLayers(fake, DRAWN_MENU_Z_INDEX.texts).find(layer => layer.texts().length > 0) || null;

export const isDrawnMenuShown = fake => textsLayer(fake) !== null;

// The message above the list (null when none; its wrapped lines joined
// as drawn, without the spaces between them) and the rows from top to
// bottom: { kind: "entry", title, mark } (mark: "check", "radio",
// "submenu" or null), { kind: "heading", title } or { kind: "separator" }.
export function readDrawnMenu(fake) {
    const layer = textsLayer(fake);
    if (!layer) throw new Error("No Drawn Menu is shown.");
    let message = null;
    const rows = [];
    let inSeparator = false;
    for (const stroke of layer.strokes()) {
        if ("fill" in stroke) {
            // The gold line under a dialog's message is not a row.
            if (message !== null && rows.length === 0) continue;
            if (!inSeparator) rows.push({ kind: "separator" });
            inSeparator = true;
            continue;
        }
        inSeparator = false;
        if (!("text" in stroke)) continue;
        if (stroke.color === COLORS.message && rows.length === 0) message = message === null ? stroke.text : `${message}${stroke.text}`;
        else if (stroke.color === COLORS.heading) rows.push({ kind: "heading", title: stroke.text });
        else if (stroke.color === COLORS.gold) rows.at(-1).mark = MARK_NAMES.get(stroke.text);
        else rows.push({ kind: "entry", title: stroke.text, mark: null });
    }
    return { message, rows };
}

// A message as readDrawnMenu gives it, to compare with its full text.
export const squeezed = text => text.replace(/\s+/g, "");

// The entries' titles and the separators ("---"), the headings in brackets.
export const drawnMenuLines = fake => readDrawnMenu(fake).rows.map(row => {
    if (row.kind === "separator") return "---";
    return row.kind === "heading" ? `[${row.title}]` : row.title;
});

// The title of the highlighted entry, written in gold over the selection.
export function highlightedEntry(fake) {
    const layer = shownLayers(fake, DRAWN_MENU_Z_INDEX.selectedText).find(candidate => candidate.texts().length > 0);
    if (!layer) throw new Error("No entry is highlighted.");
    return layer.texts()[0];
}

// Presses the button, then lets the glide end; returns the event.
export function press(fake, buttonCommand) {
    const ev = fake.fire("commandbuttondown", { command: buttonCommand, repeat: false });
    fake.advanceTime(GLIDE_OVER_MS);
    return ev;
}

export function openMainMenu(fake) {
    fake.openMainMenu();
    fake.advanceTime(OPEN_OVER_MS);
}

export function openExitMenu(fake) {
    fake.openExitMenu();
    fake.advanceTime(OPEN_OVER_MS);
}

// Any menu, as PinballY opens it with these native items.
export function openMenu(fake, id, items) {
    fake.openMenu(id, items);
    fake.advanceTime(OPEN_OVER_MS);
}

// Moves down to the entry with this title, then presses Select.
export function chooseEntry(fake, title, button = "Select") {
    for (let guard = 0; highlightedEntry(fake) !== title; guard++) {
        if (guard > 100) throw new Error(`No entry titled "${title}" in the Drawn Menu.`);
        press(fake, "Next");
    }
    return press(fake, button);
}
