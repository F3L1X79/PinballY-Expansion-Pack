// ============================================================
// Reads the drawn Household Stats the way the player sees it, on the fake
// PinballY host: whether they are open, the title, the line labels, the
// columns from left to right (the Profile's name, its Avatar image, and
// each line's cell: its texts and whether its value is gold), the
// highlighted column (the one the gold halo surrounds), and opens them
// from the Profile Stats' "Household" button as a player would.
// Never loaded by PinballY.
// ============================================================

import assert from "node:assert/strict";
import { HOUSEHOLD_STATS_Z_INDEX } from "../common/household_stats_painter.js";
import { STEAMBALL_COLORS } from "../common/steamball_palette.js";
import { openProfileStats, choose, press, PROFILE_STATS_OPEN_MS } from "./profile_stats_reader.js";

export { press };

const shownLayers = (fake, zIndex) => fake.drawingLayers().filter(layer => layer.zIndex === zIndex && layer.alpha > 0);

export const isHouseholdStatsOpen = fake => shownLayers(fake, HOUSEHOLD_STATS_Z_INDEX.backdrop).length > 0;

// Its layers, shown or not: none once it closed.
export const householdStatsLayerCount = fake => fake.drawingLayers()
    .filter(layer => Object.values(HOUSEHOLD_STATS_Z_INDEX).includes(layer.zIndex)).length;

// Opens the Profile Stats from the main menu, picks "Household" and lets
// the fade end.
export function openHouseholdStats(fake, lang) {
    openProfileStats(fake, lang);
    choose(fake, lang.profileStats.buttons.household);
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
}

export function title(fake) {
    const [layer] = shownLayers(fake, HOUSEHOLD_STATS_Z_INDEX.title);
    return layer ? layer.texts()[0] : null;
}

function labelLayer(fake) {
    const [layer] = shownLayers(fake, HOUSEHOLD_STATS_Z_INDEX.labels);
    return layer;
}

export const labels = fake => labelLayer(fake).texts();

const columnLayers = fake => [...shownLayers(fake, HOUSEHOLD_STATS_Z_INDEX.columns)].sort((a, b) => a.position().x - b.position().x);

const textStrokes = layer => layer.strokes().filter(stroke => "text" in stroke);
const middleOf = rect => rect.y + rect.height / 2;

// Each column left to right: { name, avatar (the Avatar image drawn, null
// without one), cells: { [label]: { texts, isGold } } }. The labels and
// the columns share their top, so a cell is on the line of the label
// nearest its middle.
export function columns(fake) {
    const labelStrokes = textStrokes(labelLayer(fake));
    const lineOf = stroke => labelStrokes.reduce((best, label) =>
        (Math.abs(middleOf(label.rect) - middleOf(stroke.rect)) < Math.abs(middleOf(best.rect) - middleOf(stroke.rect)) ? label : best)).text;
    return columnLayers(fake).map(layer => {
        const [nameStroke, ...cellStrokes] = textStrokes(layer);
        const cells = {};
        for (const stroke of cellStrokes) {
            const line = lineOf(stroke);
            if (!cells[line]) cells[line] = { texts: [], isGold: stroke.color === STEAMBALL_COLORS.gold };
            cells[line].texts.push(stroke.text);
        }
        const [avatar = null] = layer.images();
        return { name: nameStroke.text, avatar, cells };
    });
}

export const columnNames = fake => columns(fake).map(column => column.name);

// One line across the columns, left to right: each cell's first text, or
// null when absent.
export const lineValues = (fake, label) => columns(fake).map(column => (column.cells[label] ? column.cells[label].texts[0] : null));

// The names of the columns whose value on that line is gold.
export const goldOn = (fake, label) => columns(fake).filter(column => column.cells[label] && column.cells[label].isGold).map(column => column.name);

// The name of the column the gold halo surrounds (both centred on the same point).
export function highlightedColumn(fake) {
    const lit = shownLayers(fake, HOUSEHOLD_STATS_Z_INDEX.highlight);
    assert.equal(lit.length, 1, "exactly one column is highlighted");
    const same = (a, b) => Math.abs(a - b) < 1e-9;
    const column = columnLayers(fake).find(layer => same(layer.position().x, lit[0].position().x) && same(layer.position().y, lit[0].position().y));
    return column ? textStrokes(column)[0].text : null;
}
