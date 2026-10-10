// ============================================================
// Reads the drawn Achievement List the way the player sees it, on the fake
// PinballY host: the texts of its header and footer, the items shown in
// the rows area from top to bottom, the highlighted one (the only one not
// dimmed), the whole list, walked with Next as a player would, with the
// colours each row is drawn in, its rank emblem image and its Unlock Rate
// (the Avatars and the "+N" pill beside it, from left to right), and the
// header's count per Achievement Rank and its emblem images.
// Never loaded by PinballY.
// ============================================================

import assert from "node:assert/strict";
import { ACHIEVEMENT_LIST_Z_INDEX } from "../../common/achievement_list.js";
import { RANK_COLORS } from "../../common/steamball_palette.js";

// Past the glide from one line to the next.
export const GLIDE_OVER_MS = 400;

const isShown = layer => layer.alpha > 0 && layer.texts().length > 0;

export const press = (fake, buttonCommand) => fake.fire("commandbuttondown", { command: buttonCommand, repeat: false });

// Presses the button and lets the glide end.
export function pressAndGlide(fake, buttonCommand) {
    const ev = press(fake, buttonCommand);
    fake.advanceTime(GLIDE_OVER_MS);
    return ev;
}

const chromeLayers = fake => fake.drawingLayers()
    .filter(layer => layer.zIndex === ACHIEVEMENT_LIST_Z_INDEX.mask && isShown(layer));

// The texts of the header and the footer; none when the list is closed.
export const chromeTexts = fake => chromeLayers(fake).flatMap(layer => layer.texts());

// The header's count of Unlocked Achievements per Achievement Rank: the
// text drawn right after that rank's emblem, which is in its colour.
export function headerRankCounts(fake) {
    const strokes = chromeLayers(fake).flatMap(layer => layer.strokes());
    const counts = {};
    for (const [rank, color] of Object.entries(RANK_COLORS)) {
        const emblemAt = strokes.findIndex(stroke => stroke.fill === color);
        assert.notEqual(emblemAt, -1, `the header shows the ${rank} emblem`);
        counts[rank] = strokes.slice(emblemAt).find(stroke => "text" in stroke).text;
    }
    return counts;
}

// The images of the header's emblems, from left to right.
export const headerEmblemImages = fake => fake.drawingLayers()
    .filter(layer => layer.zIndex === ACHIEVEMENT_LIST_Z_INDEX.headerEmblems && layer.alpha > 0)
    .sort((a, b) => a.position().x - b.position().x)
    .flatMap(layer => layer.images());

export const isListOpen = fake => chromeTexts(fake).length > 0;

function shownItemLayers(fake) {
    return fake.drawingLayers()
        .filter(layer => layer.zIndex === ACHIEVEMENT_LIST_Z_INDEX.items && isShown(layer))
        // Positions go up the window: the highest first.
        .sort((a, b) => b.position().y - a.position().y);
}

// The items shown in the rows area, from top to bottom: their texts and alpha.
export const shownItems = fake => shownItemLayers(fake).map(layer => ({ texts: layer.texts(), alpha: layer.alpha }));

function highlightedLayer(fake) {
    const lit = shownItemLayers(fake).filter(layer => layer.alpha === 1);
    assert.equal(lit.length, 1, "exactly one line is not dimmed");
    return lit[0];
}

// The texts of the highlighted line.
export const highlightedTexts = fake => highlightedLayer(fake).texts();

// The shown layers at this z-index sitting at the item's height, from left
// to right.
const layersBeside = (fake, itemLayer, zIndex) => fake.drawingLayers()
    .filter(layer => layer.zIndex === zIndex && layer.alpha > 0 && layer.position().y === itemLayer.position().y)
    .sort((a, b) => a.position().x - b.position().x);

// What is shown beside an item's layer: its emblem image (null when none)
// and its Unlock Rate, the Avatars and the "+N" pill.
function piecesBeside(fake, itemLayer) {
    const owners = layersBeside(fake, itemLayer, ACHIEVEMENT_LIST_Z_INDEX.owners);
    return {
        emblem: layersBeside(fake, itemLayer, ACHIEVEMENT_LIST_Z_INDEX.emblems).flatMap(layer => layer.images())[0] || null,
        owners: {
            avatars: owners.flatMap(layer => layer.images()),
            more: owners.flatMap(layer => layer.texts())[0] || null,
        },
    };
}

// Every item's layer of the open list from top to bottom, section headers
// included, with what is seen beside each: read while pressing Next until
// the highlight comes back to where it was.
function readWholeListLayers(fake, piecesOf = new Map()) {
    const order = [];
    // The shown items always follow each other in the list, so each new one
    // goes right after the shown item above it.
    function merge() {
        let insertAt = 0;
        for (const layer of shownItemLayers(fake)) {
            piecesOf.set(layer, piecesBeside(fake, layer));
            const index = order.indexOf(layer);
            if (index === -1) order.splice(insertAt++, 0, layer);
            else insertAt = index + 1;
        }
    }
    merge();
    const start = highlightedLayer(fake);
    for (let guard = 0; guard < 1000; guard++) {
        pressAndGlide(fake, "Next");
        merge();
        if (highlightedLayer(fake) === start) return order;
    }
    throw new Error("The highlight never came back to where it was.");
}

// Every item of the open list from top to bottom, as their texts.
export const readWholeList = fake => readWholeListLayers(fake).map(layer => layer.texts());

function readSectionLayers(fake, TEXT, piecesOf) {
    const sectionTitles = [TEXT.unlockedSection, TEXT.missingSection].map(title => title.toLocaleUpperCase());
    const sections = [];
    for (const layer of readWholeListLayers(fake, piecesOf)) {
        if (sectionTitles.includes(layer.texts()[0])) sections.push({ header: layer, rows: [] });
        else sections.at(-1).rows.push(layer);
    }
    return sections;
}

// The whole list split under its two section headers: each section's
// header texts and its rows' texts.
export const readSections = (fake, TEXT) => readSectionLayers(fake, TEXT)
    .map(({ header, rows }) => ({ header: header.texts(), rows: rows.map(layer => layer.texts()) }));

// The rows of the whole list, each with its title, description, the
// short text of its Achievement Progress (null when it shows none),
// whether it sits in the Unlocked section, the colours it is drawn in, its
// emblem image (null when its emblem is drawn) and its Unlock Rate
// ({ avatars: image paths, more: the "+N" text or null }).
export function readRows(fake, TEXT) {
    const piecesOf = new Map();
    const [unlocked, missing] = readSectionLayers(fake, TEXT, piecesOf);
    const toRow = isUnlocked => layer => {
        const [title, description, progress = null] = layer.texts();
        return { title, description, progress, unlocked: isUnlocked, fills: layer.fills(), ...piecesOf.get(layer) };
    };
    return [...unlocked.rows.map(toRow(true)), ...missing.rows.map(toRow(false))];
}

// The scrollbar's thumb as the player sees it, in window pixels: its
// horizontal centre, its top and its height; null when none shows.
export function scrollbarThumb(fake, { width, height } = { width: 1920, height: 1080 }) {
    const shown = fake.drawingLayers().filter(layer => layer.zIndex === ACHIEVEMENT_LIST_Z_INDEX.scrollbarThumb && layer.alpha > 0);
    assert.ok(shown.length <= 1, "at most one thumb shows");
    if (shown.length === 0) return null;
    const [layer] = shown;
    const thumbHeight = layer.scale().ySpan * height;
    return {
        x: (layer.position().x + 0.5) * width,
        top: (0.5 - layer.position().y) * height - thumbHeight / 2,
        height: thumbHeight,
    };
}
