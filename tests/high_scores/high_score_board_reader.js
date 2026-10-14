// ============================================================
// Reads the drawn High Score Board the way the player sees it, on the fake
// PinballY host: whether it is open, the title, the message shown in place
// of the board, the podium's three steps (left, middle, right) and the rows
// below it, each place with its rank, owner's name or "Default score",
// Avatar image, initials, score text and whether it is marked as the Table
// Record, and the Avatar Frame drawn around its Avatar; and whether every
// layer is gone after close. Opens it from the main menu entry. Never
// loaded by PinballY.
// ============================================================

import { HIGH_SCORE_BOARD_Z_INDEX } from "../../common/high_scores/high_score_board_painter.js";
import { shownFrame, isFrameImage } from "../avatar_frames/avatar_frame_reader.js";

// Past the fade in.
export const BOARD_OPEN_MS = 300;

export const press = (fake, buttonCommand) => fake.fire("commandbuttondown", { command: buttonCommand, repeat: false });

const shownLayers = (fake, zIndex) => fake.drawingLayers().filter(layer => layer.zIndex === zIndex && layer.alpha > 0);

export const isBoardOpen = fake => shownLayers(fake, HIGH_SCORE_BOARD_Z_INDEX.backdrop).length > 0;

// Its layers, shown or not: none once it closed.
export const boardLayerCount = fake => fake.drawingLayers()
    .filter(layer => Object.values(HIGH_SCORE_BOARD_Z_INDEX).includes(layer.zIndex)).length;

// The main menu's titles as PinballY shows it, with its native entries,
// and where the High Score Board's entry is among them (-1: absent). Found
// by its command: PinballY's own "High Scores" entry has the same title.
export function mainMenuTitles(fake) {
    fake.openMainMenu();
    const { items } = fake.currentMenu();
    fake.closeMenu();
    const boardCmd = fake.commandId("highScoreBoard");
    return { titles: items.map(item => item.title), boardEntry: items.findIndex(item => boardCmd !== undefined && item.cmd === boardCmd) };
}

// Opens the main menu, selects the High Score Board's entry and lets the fade end.
export function openBoard(fake, lang) {
    fake.openMainMenu();
    fake.selectMenuItem(lang.highScores.board.menuEntry);
    fake.advanceTime(BOARD_OPEN_MS);
}

const firstText = (fake, zIndex) => {
    const [layer] = shownLayers(fake, zIndex);
    return layer ? layer.texts()[0] : null;
};

export const title = fake => firstText(fake, HIGH_SCORE_BOARD_Z_INDEX.title);

// The message shown in place of the board ("No score yet"), or null.
export const message = fake => firstText(fake, HIGH_SCORE_BOARD_Z_INDEX.message);

// A place's layer: { rank, name, avatar (the image drawn, null without
// one), initials, score, isTableRecord }. A podium step reads rank, the
// "Record" mark on the Table Record, name, score, initials; a row reads
// rank, name, initials, score.
function placeOf(layer, TEXT, isStep) {
    const texts = layer.texts();
    const isTableRecord = texts.includes(TEXT.record);
    const [rank, name, ...rest] = texts.filter(text => text !== TEXT.record);
    const [initials, score] = isStep ? [rest[1], rest[0]] : rest;
    const [avatar = null] = layer.images().filter(image => !isFrameImage(image));
    return { rank, name, avatar, initials, score, isTableRecord };
}

// The podium's step layers by where they stand: { left, middle, right },
// null when left empty. The panel is centred on the window.
function stepLayers(fake) {
    const steps = { left: null, middle: null, right: null };
    for (const layer of shownLayers(fake, HIGH_SCORE_BOARD_Z_INDEX.podium)) {
        const { x } = layer.position();
        steps[Math.abs(x) < 1e-6 ? "middle" : (x < 0 ? "left" : "right")] = layer;
    }
    return steps;
}

const mapSteps = (steps, read) => Object.fromEntries(Object.entries(steps).map(([where, layer]) => [where, layer && read(layer)]));

// The podium's steps by where they stand: { left, middle, right }, each a
// place or null when left empty.
export const podium = (fake, lang) => mapSteps(stepLayers(fake), layer => placeOf(layer, lang.highScores.board, true));

// The rows under the podium, top down (positions grow upwards).
const rowLayers = fake => shownLayers(fake, HIGH_SCORE_BOARD_Z_INDEX.rows).sort((a, b) => b.position().y - a.position().y);

export const rows = (fake, lang) => rowLayers(fake).map(layer => placeOf(layer, lang.highScores.board, false));

// The Avatar Frame a place's layer draws: { tier, size (of the image),
// isAroundAvatar (a quarter of the Avatar's box beyond it on every side),
// isInside (within the layer) }, null for none.
function frameOf(layer) {
    const frame = shownFrame(layer);
    if (!frame) return null;
    const avatarImage = layer.strokes().find(stroke => "image" in stroke && !isFrameImage(stroke.image));
    // The Avatar's image is drawn 3 px inside its box.
    const box = avatarImage && { x: avatarImage.rect.x - 3, y: avatarImage.rect.y - 3, size: avatarImage.rect.width + 6 };
    const near = (a, b) => Math.abs(a - b) < 1e-6;
    const { rect } = frame;
    const isAroundAvatar = Boolean(box) && near(rect.x, box.x - box.size / 4) && near(rect.y, box.y - box.size / 4)
        && near(rect.width, box.size * 1.5) && near(rect.height, box.size * 1.5);
    const canvas = layer.canvasSize();
    const isInside = rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= canvas.width + 1e-6 && rect.y + rect.height <= canvas.height + 1e-6;
    return { tier: frame.tier, size: frame.size, isAroundAvatar, isInside };
}

// The frame around each Avatar: { podium: { left, middle, right }, rows
// (top down) }, a step left empty null.
export const frames = fake => ({ podium: mapSteps(stepLayers(fake), frameOf), rows: rowLayers(fake).map(frameOf) });

// The discreet note over a known board ("Reading…", "could not be refreshed"), or null.
export const note = fake => firstText(fake, HIGH_SCORE_BOARD_Z_INDEX.note);
