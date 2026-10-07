// ============================================================
// Reads the drawn Profile Stats the way the player sees it, on the fake
// PinballY host: whether they are open, the card's texts (the Profile's
// name first) and Avatar, its Player Level and Collection Mastery blocks,
// the buttons at the card's foot (label and grey count), a section of the
// right column by its title (each stat's label with the texts drawn after
// it, and its images), the highlighted choice (the button under the gold
// halo, or the cross's tooltip), and picks a choice with Next and Select
// as a player would. Opens them from the main menu entry.
// Never loaded by PinballY.
// ============================================================

import assert from "node:assert/strict";
import { PROFILE_STATS_Z_INDEX } from "../common/profile_stats_painter.js";

// Past the fade in.
export const PROFILE_STATS_OPEN_MS = 300;

export const press = (fake, buttonCommand) => fake.fire("commandbuttondown", { command: buttonCommand, repeat: false });

const shownLayers = (fake, zIndex) => fake.drawingLayers().filter(layer => layer.zIndex === zIndex && layer.alpha > 0);

export const isProfileStatsOpen = fake => shownLayers(fake, PROFILE_STATS_Z_INDEX.backdrop).length > 0;

// Its layers, shown or not: none once it closed.
export const profileStatsLayerCount = fake => fake.drawingLayers()
    .filter(layer => Object.values(PROFILE_STATS_Z_INDEX).includes(layer.zIndex)).length;

// Opens the main menu, selects the Profile Stats entry and lets the fade end.
export function openProfileStats(fake, lang) {
    fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
    fake.selectMenuItem(lang.profileStats.menuEntry);
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
}

// The card's texts, top to bottom: the Profile's name first.
export const cardTexts = fake => shownLayers(fake, PROFILE_STATS_Z_INDEX.card).flatMap(layer => layer.texts());

// The texts drawn after title on the card, up to the next of titles (or
// the card's end).
function cardBlock(fake, title, titles) {
    const texts = cardTexts(fake);
    const start = texts.indexOf(title);
    if (start < 0) return null;
    const end = texts.findIndex((candidate, index) => index > start && titles.includes(candidate));
    return texts.slice(start + 1, end < 0 ? texts.length : end);
}

// The Player Level block: { level (the big digits), current (the points
// line) }; null when not shown. TEXT: lang.profileStats.
export function playerLevel(fake, TEXT) {
    const block = cardBlock(fake, TEXT.playerLevel.title, [TEXT.collectionTitle]);
    return block && { level: block[0], current: block[1] };
}

// The Collection Mastery block: { goal, current (null at the last tier),
// tier (the number in its square) }; null when not shown.
export function collectionMastery(fake, TEXT) {
    const block = cardBlock(fake, TEXT.collectionTitle, []);
    if (!block) return null;
    return { goal: block[0], current: block.length > 2 ? block[1] : null, tier: Number(block[block.length - 1]) };
}

export const cardImages = fake => shownLayers(fake, PROFILE_STATS_Z_INDEX.card).flatMap(layer => layer.images());

// Top to bottom: a layer's position is measured upward.
const topToBottom = layers => [...layers].sort((a, b) => b.position().y - a.position().y);

const buttonLayers = fake => topToBottom(shownLayers(fake, PROFILE_STATS_Z_INDEX.buttons));

// Each button at the card's foot, top to bottom: { label, count }.
export const buttons = fake => buttonLayers(fake).map(layer => {
    const [label, count = null] = layer.texts();
    return { label, count };
});

// A section of the right column by its title: { [label]: texts drawn
// after it, up to the next label }; null when it is not shown. labels: the
// stat labels, from lang.profileStats.stats.
export function section(fake, title, labels) {
    const layer = shownLayers(fake, PROFILE_STATS_Z_INDEX.sections).find(candidate => candidate.texts()[0] === title);
    if (!layer) return null;
    const known = new Set(Object.values(labels));
    const stats = {};
    let current = null;
    for (const text of layer.texts().slice(1)) {
        if (known.has(text)) stats[current = text] = [];
        else if (current !== null) stats[current].push(text);
    }
    return stats;
}

// The images drawn in a section of the right column, by its title.
export function sectionImages(fake, title) {
    const layer = shownLayers(fake, PROFILE_STATS_Z_INDEX.sections).find(candidate => candidate.texts()[0] === title);
    return layer ? layer.images() : [];
}

function haloLayer(fake) {
    const lit = shownLayers(fake, PROFILE_STATS_Z_INDEX.highlights);
    assert.equal(lit.length, 1, "exactly one choice is highlighted");
    return lit[0];
}

// The highlighted choice: the cross's tooltip, or the label of the button
// the halo surrounds (both centred on the same point).
export function highlighted(fake) {
    const halo = haloLayer(fake);
    const [tooltip] = halo.texts();
    if (tooltip) return tooltip;
    const same = (a, b) => Math.abs(a - b) < 1e-9;
    const button = buttonLayers(fake).find(layer =>
        same(layer.position().x, halo.position().x) && same(layer.position().y, halo.position().y));
    return button ? button.texts()[0] : null;
}

// Every choice, in the order Next walks them from the highlighted one,
// which comes back highlighted.
export function readChoices(fake) {
    const names = [highlighted(fake)];
    for (let guard = 0; guard < 20; guard++) {
        press(fake, "Next");
        const name = highlighted(fake);
        if (name === names[0]) return names;
        names.push(name);
    }
    throw new Error("The highlight never came back to where it was.");
}

// Moves the highlight with Next to this button's label or tooltip, then
// presses Select.
export function choose(fake, name) {
    for (let guard = 0; guard < 20 && highlighted(fake) !== name; guard++) press(fake, "Next");
    assert.equal(highlighted(fake), name, `the Profile Stats offer "${name}"`);
    return press(fake, "Select");
}
