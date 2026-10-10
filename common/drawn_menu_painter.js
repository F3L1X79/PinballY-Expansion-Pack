// ============================================================
// Drawn Menu painter: the look and the layout of a Drawn Menu. Lays a menu out in the window (one centred panel
// sized to its rows, scrolling past 90 % of the window's height) and
// draws its live parts: the texts (the message, the entries in white
// with their gold mark, the headings, the separators as a gold line
// fading at both ends), the selected entry's gold text, the dimming
// backdrop and the painted images (common/drawn_menu_images.js).
// Only drawing: no layer, no event, no side effect.
// ============================================================

import { STEAMBALL_COLORS as COLORS, STEAMBALL_FONTS as FONTS } from "./steamball_palette.js";
import { oneLine, text, UNBOUNDED } from "./steamball_drawing.js";
import { withAlpha } from "./table_mastery.js";
import {
    DRAWN_MENU_PANEL_WIDTH, DRAWN_MENU_FACE_INSET, DRAWN_MENU_LIST_WIDTH, DRAWN_MENU_ENTRY_HEIGHT,
    DRAWN_MENU_SELECTION_MARGIN, DRAWN_MENU_IMAGES,
} from "./drawn_menu_images.js";

// Above the Welcome Screen, the Profile Stats and the Avatar Frame List,
// under the toasts and the Profile picker (6500), the Confetti Shower and
// the Fireworks. Exported for the tests' reader.
export const DRAWN_MENU_Z_INDEX = Object.freeze({ backdrop: 6200, panel: 6201, texts: 6202, selection: 6203, selectedText: 6204, glass: 6205 });

export const ROW_KIND = Object.freeze({ ENTRY: "entry", HEADING: "heading", SEPARATOR: "separator" });

// Sizes in pixels at the 1920 px reference height, at which the painted
// images show 1:1.
export const DRAWN_MENU_LOOK = Object.freeze({
    referenceHeight: 1920,
    // Of the window: the panel's width at most, and its height before the list scrolls.
    maxWidthShare: 0.75,
    maxHeightShare: 0.9,
    // From the face's gold frame to the first and after the last row.
    listTop: 54,
    listBottom: 50,
    // The shortest panel the glass's top and bottom fit in.
    minPanelHeight: Math.max(
        DRAWN_MENU_IMAGES.panel.top.height + DRAWN_MENU_IMAGES.panel.bottom.height,
        DRAWN_MENU_IMAGES.glass.top.height + DRAWN_MENU_IMAGES.glass.bottom.height),
    rowHeights: Object.freeze({ entry: DRAWN_MENU_ENTRY_HEIGHT, heading: 50, separator: 30 }),
    entry: Object.freeze({ size: 36, minSize: 28, weight: 600 }),
    heading: Object.freeze({ size: 24, minSize: 20, weight: 600 }),
    message: Object.freeze({ size: 33, weight: 400, gap: 14 }),
    mark: Object.freeze({ size: 30, weight: 600, right: 36, width: 40 }),
    separatorWidth: 320,
    // The rows fading at an edge the list scrolls past.
    edgeAlpha: 0x60,
    colors: Object.freeze({
        entry: COLORS.title,
        heading: COLORS.dim,
        message: COLORS.description,
        gold: COLORS.gold,
        backdrop: 0xB0080A0E,
    }),
});

// The glyph of each entry's mark, written in gold.
export const DRAWN_MENU_MARKS = Object.freeze({ check: "\u2713", radio: "\u25CF", submenu: "\u203A" });

const LOOK = DRAWN_MENU_LOOK;

const heightOf = row => LOOK.rowHeights[row.kind];

// The menu's layout in the window ({ width, height }), in window pixels
// unless named "Ref" (reference pixels): k turns the one into the other.
// messageHeightAt(widthPx, sizePx) measures the message, when there is one.
export function computeGeometry({ width, height }, model, messageHeightAt) {
    const windowScale = height / LOOK.referenceHeight;
    const zoom = Math.min(1, LOOK.maxWidthShare * (width / windowScale) / DRAWN_MENU_PANEL_WIDTH);
    const k = windowScale * zoom;
    const listWidth = DRAWN_MENU_LIST_WIDTH * k;
    let rowTopRef = 0;
    const rowTopsRef = model.rows.map(row => {
        const top = rowTopRef;
        rowTopRef += heightOf(row);
        return top;
    });
    const rowsHeightRef = rowTopRef;
    const messageHeightRef = model.message === null ? 0 : messageHeightAt(listWidth, LOOK.message.size * k) / k;
    const messageBlockRef = model.message === null ? 0 : messageHeightRef + LOOK.message.gap + LOOK.rowHeights.separator;
    const fixedRef = 2 * DRAWN_MENU_FACE_INSET + LOOK.listTop + LOOK.listBottom + messageBlockRef;
    const maxPanelRef = LOOK.maxHeightShare * LOOK.referenceHeight / zoom;
    const areaHeightRef = Math.max(LOOK.rowHeights.entry, Math.min(rowsHeightRef, maxPanelRef - fixedRef));
    const panelHeightRef = Math.max(LOOK.minPanelHeight, fixedRef + areaHeightRef);
    const contentTopRef = DRAWN_MENU_FACE_INSET + LOOK.listTop + (panelHeightRef - fixedRef - areaHeightRef) / 2;
    const panelTop = (height - panelHeightRef * k) / 2;
    return {
        width,
        height,
        k,
        panel: { x: (width - DRAWN_MENU_PANEL_WIDTH * k) / 2, y: panelTop, width: DRAWN_MENU_PANEL_WIDTH * k, height: panelHeightRef * k },
        listX: (width - listWidth) / 2,
        listWidth,
        // The texts' layer: from the message down to the list's bottom edge.
        contentTop: panelTop + contentTopRef * k,
        contentHeight: (messageBlockRef + areaHeightRef) * k,
        messageHeight: messageHeightRef * k,
        // From the content's top to the list's.
        areaOffset: messageBlockRef * k,
        areaHeight: areaHeightRef * k,
        rowTops: rowTopsRef.map(top => top * k),
        rowsHeight: rowsHeightRef * k,
    };
}

export const rowHeightIn = (geometry, row) => heightOf(row) * geometry.k;

// One line in the box, centred: one measure and one draw, the cost of a
// line; only a line too wide goes through oneLine(), which shrinks then
// cuts it.
function line(host, dc, str, { x, y, width, height, size, minSize, weight, color, font = FONTS.body }) {
    const styled = host.createStyledText({ textAlign: "left", textStyle: { font, size, weight, color } });
    styled.add(str);
    const measured = styled.measure(UNBOUNDED);
    if (measured.width > width) {
        oneLine(host, dc, str, { x, y, width, height, size, minSize, weight, color, font, align: "center" });
        return;
    }
    styled.draw(dc, { x: x + (width - measured.width) / 2, y: y + (height - measured.height) / 2, width: measured.width + 4, height: measured.height });
}

// The gold line fading at both ends, centred in the box, as short fills.
function drawSeparator(dc, x, y, width, height, k, alpha) {
    const lineWidth = LOOK.separatorWidth * k;
    const left = x + (width - lineWidth) / 2;
    const top = Math.round(y + height / 2);
    const steps = 32;
    for (let step = 0; step < steps; step++) {
        const middle = (step + 0.5) / steps;
        const strength = 1 - Math.abs(middle - 0.5) * 2;
        dc.fillRect(Math.round(left + step * lineWidth / steps), top, Math.ceil(lineWidth / steps), 1,
            withAlpha(LOOK.colors.gold, Math.round(0xBF * strength * alpha / 0xFF)));
    }
}

const markGlyphOf = row => DRAWN_MENU_MARKS[row.mark] || null;

// An entry's title and mark, in its colour, in the box.
function drawEntry(host, dc, row, { x, y, width, height, k, color, markColor }) {
    const markRoom = (LOOK.mark.right + LOOK.mark.width) * k;
    line(host, dc, row.title, {
        x: x + markRoom, y, width: width - 2 * markRoom, height,
        size: LOOK.entry.size * k, minSize: LOOK.entry.minSize * k, weight: LOOK.entry.weight, color,
    });
    const mark = markGlyphOf(row);
    if (!mark) return;
    line(host, dc, mark, {
        x: x + width - markRoom, y, width: LOOK.mark.width * k, height,
        size: LOOK.mark.size * k, minSize: LOOK.mark.size * k, weight: LOOK.mark.weight, color: markColor,
    });
}

// The texts' layer, on a canvas of the content's size: the message, then
// the rows shown at this scroll (whole rows only), those at an edge the
// list scrolls past faded.
export function drawTexts(host, dc, geometry, model, scroll) {
    const { k, listWidth, areaOffset, areaHeight } = geometry;
    if (model.message !== null) {
        text(host, dc, model.message, {
            x: 0, y: 0, width: listWidth, height: geometry.messageHeight,
            size: LOOK.message.size * k, weight: LOOK.message.weight, color: LOOK.colors.message, align: "center",
        });
        drawSeparator(dc, 0, geometry.messageHeight + LOOK.message.gap * k, listWidth, LOOK.rowHeights.separator * k, k, 0xFF);
    }
    const canScrollUp = scroll > 0.5;
    const canScrollDown = scroll + areaHeight < geometry.rowsHeight - 0.5;
    const edge = LOOK.rowHeights.entry * k;
    model.rows.forEach((row, index) => {
        const top = geometry.rowTops[index] - scroll;
        const height = rowHeightIn(geometry, row);
        if (top < -0.5 || top + height > areaHeight + 0.5) return;
        const faded = (canScrollUp && top < edge) || (canScrollDown && top + height > areaHeight - edge);
        const alpha = faded ? LOOK.edgeAlpha : 0xFF;
        const shade = color => (faded ? withAlpha(color, alpha) : color);
        const box = { x: 0, y: areaOffset + top, width: listWidth, height };
        if (row.kind === ROW_KIND.SEPARATOR) {
            drawSeparator(dc, box.x, box.y, box.width, box.height, k, alpha);
        } else if (row.kind === ROW_KIND.HEADING) {
            line(host, dc, row.title.toLocaleUpperCase(), {
                ...box, size: LOOK.heading.size * k, minSize: LOOK.heading.minSize * k, weight: LOOK.heading.weight,
                color: shade(LOOK.colors.heading), font: FONTS.display,
            });
        } else {
            drawEntry(host, dc, row, { ...box, k, color: shade(LOOK.colors.entry), markColor: shade(LOOK.colors.gold) });
        }
    });
}

// The selected entry in gold, on a canvas of one entry's size.
export function drawSelectedText(host, dc, geometry, row) {
    const height = LOOK.rowHeights.entry * geometry.k;
    drawEntry(host, dc, row, { x: 0, y: 0, width: geometry.listWidth, height, k: geometry.k, color: LOOK.colors.gold, markColor: LOOK.colors.gold });
}

export function drawBackdrop(dc) {
    const { width, height } = dc.getSize();
    dc.fillRect(0, 0, width, height, LOOK.colors.backdrop);
}

// The selection's outline image with its glow margin, in window pixels.
export function selectionSize(geometry) {
    const { selection } = DRAWN_MENU_IMAGES;
    return { width: selection.width * geometry.k, height: selection.height * geometry.k, margin: DRAWN_MENU_SELECTION_MARGIN * geometry.k };
}
