// ============================================================
// High Score Board painter: the layout and drawing of the High Score
// Board's pieces, in board pixels zoomed to fit the window (whose height
// is REFERENCE_HEIGHT reference pixels), on the Drawn Menu's panel and
// glass images: the table's title and a discreet note under it, then the
// podium (the 2nd place on the left, the 1st in the middle and highest,
// the 3rd on the right, each under its crown, above where an Avatar
// Frame reaches), then the places from the 4th on in compact rows, as
// many in view as the window's height leaves room for; or a message in place of the board. Each Avatar
// wears its Profile's Avatar Frame, if any, as on the Profile Stats. Only
// drawing: no layer, no event, no side effect.
// ============================================================

import { STEAMBALL_COLORS as COLORS, STEAMBALL_FONTS as FONTS, RANK_COLORS } from "../drawing/steamball_palette.js";
import { oneLine, drawAvatar, drawAvatarFrame, avatarFrameSide, AVATAR_FRAME_MARGIN } from "../drawing/steamball_drawing.js";
import { ACHIEVEMENT_RANK } from "../achievements/achievements.js";
import { DRAWN_MENU_IMAGES, DRAWN_MENU_IMAGES_FOLDER, DRAWN_MENU_PANEL_WIDTH, DRAWN_MENU_FACE_INSET, DRAWN_MENU_LIST_INSET } from "../drawn_menu/drawn_menu_images.js";

// Between the Household Stats and the Drawn Menus, which never show at the
// same time, so each reader sees only its own layers.
export const HIGH_SCORE_BOARD_Z_INDEX = Object.freeze({ backdrop: 6180, panel: 6181, title: 6182, note: 6183, message: 6184, podium: 6185, rows: 6186, glass: 6188 });
// The crowns' layers, drawn ahead and kept while the board is closed: over
// the podium, under the glass.
export const HIGH_SCORE_BOARD_CROWN_Z_INDEX = 6187;

export const REFERENCE_HEIGHT = 1920;
// The places on the podium, the others in rows below it.
export const PODIUM_PLACES = 3;

// The 1st, 2nd and 3rd places' metal, as the crowns over them.
const METALS = [RANK_COLORS[ACHIEVEMENT_RANK.GOLD], RANK_COLORS[ACHIEVEMENT_RANK.SILVER], RANK_COLORS[ACHIEVEMENT_RANK.BRONZE]];
// The 1st, 2nd and 3rd places' crown images, in the pack's assets\ folder.
export const CROWN_IMAGES = Object.freeze(["gold", "silver", "bronze"].map(metal => `assets\\images\\crown_${metal}.png`));
// The side of a crown's square canvas, as its image's.
export const CROWN_CANVAS = 512;
const LIGHT_GOLD = 0xFFFFE6A6;
const DIMMING = 0xB0080A0E;

const LOOK = Object.freeze({
    // From the panel's edges to the content, as the Drawn Menu's entries.
    sideInset: DRAWN_MENU_FACE_INSET + DRAWN_MENU_LIST_INSET, topInset: DRAWN_MENU_FACE_INSET + 40, bottomInset: DRAWN_MENU_FACE_INSET + 40,
    titleH: 50, titleSize: 34, minTitleSize: 22, noteH: 30, noteSize: 15, titleGap: 6,
    messageH: 200, messageSize: 26,
    // The podium's steps, the 1st's first: the crown's room, the Avatar,
    // the block under it; the steps stand on the same floor. The crown
    // stands crownGap above the Avatar, or above where its Avatar Frame
    // reaches into the crown's room when one is worn.
    stepGap: 14, crownH: [150, 132, 118], crownGap: 10, avatar: [120, 106, 92], avatarGap: 10, blockH: [204, 184, 164],
    edge: 4, blockPad: 10, rankH: 44, rankSize: 28, recordH: 24, recordSize: 14,
    nameH: 36, nameSize: 20, minNameSize: 14, scoreH: 40, scoreSize: 22, recordScoreSize: 26, minScoreSize: 14, initialsH: 28, initialsSize: 15,
    // The rows from the 4th place on.
    rowsGap: 18, rowH: 64, rowGap: 8, rowPad: 8, tile: 48, rowAvatar: 48, cellGap: 14, rowInitialsW: 80, rowScoreW: 200,
    rowRankSize: 18, rowNameSize: 18, rowInitialsSize: 15, rowScoreSize: 20,
});

// How wide an Avatar Frame is drawn at most, for its image's size.
export const AVATAR_FRAME_WIDTH = avatarFrameSide(Math.max(...LOOK.avatar, LOOK.rowAvatar));

const stepH = index => LOOK.crownH[index] + LOOK.avatar[index] + LOOK.avatarGap + LOOK.blockH[index];
const PODIUM_H = Math.max(...Array.from({ length: PODIUM_PLACES }, (_, index) => stepH(index)));

// The board's fit in the window: its panel at most these shares of the
// window's width and height, zoomed up to maxZoom in a wide window so
// it reads from afar.
const FIT = Object.freeze({ widthShare: 0.9, heightShare: 0.9, maxZoom: 2 });

const rowsHeight = rowCount => (rowCount === 0 ? 0 : LOOK.rowsGap + rowCount * LOOK.rowH + (rowCount - 1) * LOOK.rowGap);
const MIN_PANEL_H = Math.max(
    DRAWN_MENU_IMAGES.panel.top.height + DRAWN_MENU_IMAGES.panel.bottom.height,
    DRAWN_MENU_IMAGES.glass.top.height + DRAWN_MENU_IMAGES.glass.bottom.height);

// The board's layout in a window referenceWidth wide, for placeCount
// places. Its rects are in board pixels from the panel's top left, each
// also the size its piece is drawn at; placedRect() puts one in the
// window. Gives the panel, the title, the note's line under it, then
// either the message's box or the podium's steps (the 1st's first, those
// with no place included), the crowns over them (framed: over an Avatar
// wearing an Avatar Frame, bare: over one without), and one rect per row
// as if none were scrolled.
// zoom: board to reference pixels; rowsInView: how many rows show at
// once (all of them when they fit), the others scrolling rowPitch apart.
export function layoutHighScoreBoard(referenceWidth, placeCount) {
    const w = DRAWN_MENU_PANEL_WIDTH;
    const rowCount = Math.max(0, placeCount - PODIUM_PLACES);
    const panelOf = bodyH => Math.max(MIN_PANEL_H, LOOK.topInset + LOOK.titleH + LOOK.noteH + LOOK.titleGap + bodyH + LOOK.bottomInset);
    const panelH = rowsShown => panelOf(placeCount === 0 ? LOOK.messageH : PODIUM_H + rowsHeight(rowsShown));
    const maxH = FIT.heightShare * REFERENCE_HEIGHT;
    // Small enough for the podium and one row at least, whatever the
    // board holds: the "Reading..." message keeps the zoom of the board
    // that replaces it.
    const zoom = Math.min(FIT.maxZoom, FIT.widthShare * referenceWidth / w, maxH / panelOf(PODIUM_H + rowsHeight(1)));
    let rowsInView = rowCount;
    while (rowsInView > 1 && panelH(rowsInView) * zoom > maxH) rowsInView--;
    const h = panelH(rowsInView);
    const panel = { x: 0, y: 0, w, h };
    // Not rounded, so the 1st place stands on the window's middle.
    const origin = { x: (referenceWidth - w * zoom) / 2, y: (REFERENCE_HEIGHT - h * zoom) / 2 };
    const x = LOOK.sideInset;
    const contentW = w - 2 * LOOK.sideInset;
    const title = { x, y: LOOK.topInset, w: contentW, h: LOOK.titleH };
    const note = { x, y: title.y + title.h, w: contentW, h: LOOK.noteH };
    const bodyY = note.y + note.h + LOOK.titleGap;
    const message = { x, y: bodyY, w: contentW, h: LOOK.messageH };
    const stepW = Math.floor((contentW - (PODIUM_PLACES - 1) * LOOK.stepGap) / PODIUM_PLACES);
    // The 1st centred on the panel, so it stands in the middle whatever the rounding.
    const middleX = (w - stepW) / 2;
    const stepXs = [middleX, middleX - LOOK.stepGap - stepW, middleX + stepW + LOOK.stepGap];
    const steps = stepXs.map((stepX, index) => ({ x: stepX, y: bodyY + PODIUM_H - stepH(index), w: stepW, h: stepH(index) }));
    const crowns = steps.map((step, index) => {
        const reach = LOOK.avatar[index] * AVATAR_FRAME_MARGIN;
        const side = LOOK.crownH[index] - reach - LOOK.crownGap;
        const framed = { x: step.x + (step.w - side) / 2, y: step.y, w: side, h: side };
        return { framed, bare: { ...framed, y: framed.y + reach } };
    });
    const rowPitch = LOOK.rowH + LOOK.rowGap;
    const rowsY = bodyY + PODIUM_H + LOOK.rowsGap;
    const rows = Array.from({ length: rowCount }, (_, index) => ({ x, y: rowsY + index * rowPitch, w: contentW, h: LOOK.rowH }));
    return { zoom, origin, panel, title, note, message, steps, crowns, rows, rowsInView, rowPitch };
}

// A rect of the layout in reference pixels from the window's top left,
// moved up by shiftY board pixels (a scrolled row).
export function placedRect({ zoom, origin }, rect, shiftY = 0) {
    return { x: origin.x + rect.x * zoom, y: origin.y + (rect.y - shiftY) * zoom, w: rect.w * zoom, h: rect.h * zoom };
}

// projectFolder: where the pack's assets\ folder is.
export function drawCrown(dc, projectFolder, index) {
    dc.drawImage(`${projectFolder}\\${CROWN_IMAGES[index]}`, 0, 0, CROWN_CANVAS, CROWN_CANVAS);
}

export function drawBackdrop(dc, { width, height }) {
    dc.fillRect(0, 0, width, height, DIMMING);
}

// A top, a middle stretched to the panel's height and a bottom, the panel
// w wide and h high. GDI+ fades a stretched image's last source row into
// transparency, a band where the wheel shows through: an opaque middle
// (the panel's) is drawn one stretched row longer, under the bottom.
function drawSlices(dc, folder, slices, w, h, isOpaque) {
    const path = slice => `${folder}\\${DRAWN_MENU_IMAGES_FOLDER}\\${slice.file}`;
    dc.drawImage(path(slices.top), 0, 0, w, slices.top.height);
    const middleH = h - slices.top.height - slices.bottom.height;
    const rows = slices.middle.height;
    const drawnH = isOpaque ? middleH * rows / (rows - 1) : middleH;
    if (middleH > 0) dc.drawImage(path(slices.middle), 0, slices.top.height, w, drawnH);
    dc.drawImage(path(slices.bottom), 0, h - slices.bottom.height, w, slices.bottom.height);
}

// projectFolder: where the pack's assets\ folder is.
export const drawPanel = (dc, projectFolder, w, h) => drawSlices(dc, projectFolder, DRAWN_MENU_IMAGES.panel, w, h, true);
// Over the texts, as on the Drawn Menu.
export const drawGlass = (dc, projectFolder, w, h) => drawSlices(dc, projectFolder, DRAWN_MENU_IMAGES.glass, w, h, false);

export function drawTitle(host, dc, title, w, h) {
    oneLine(host, dc, title, { x: 0, y: 0, width: w, height: h, size: LOOK.titleSize, minSize: LOOK.minTitleSize, weight: 700, color: COLORS.gold, font: FONTS.display, align: "center" });
}

// A discreet line under the title, over a board shown: "Reading...", or
// that it could not be refreshed.
export function drawNote(host, dc, note, w, h) {
    oneLine(host, dc, note, { x: 0, y: 0, width: w, height: h, size: LOOK.noteSize, weight: 400, color: COLORS.dim, align: "center" });
}

export function drawMessage(host, dc, message, w, h) {
    oneLine(host, dc, message, { x: 0, y: 0, width: w, height: h, size: LOOK.messageSize, weight: 400, color: COLORS.description, align: "center" });
}

// place: { rank, name, isDefaultScore, avatarPath (null: none), framePath
// (the worn Avatar Frame's image, null: none), initials (a mark when
// empty), score (formatted), isTableRecord } on the podium's step index (0
// for the 1st); recordLabel: the Table Record's mark. From the top: the
// crown's room (the crown on its own layer), the Avatar in its frame
// (reaching into the crown's room, below the crown), then
// the block with its metal edge: rank, the mark on the Table Record, name,
// score, initials.
export function drawStep(host, dc, place, index, recordLabel, w) {
    const metal = METALS[index];
    const avatar = LOOK.avatar[index];
    const avatarY = LOOK.crownH[index];
    const avatarX = Math.round((w - avatar) / 2);
    drawAvatar(dc, place.avatarPath, avatarX, avatarY, avatar);
    drawAvatarFrame(dc, place.framePath, avatarX, avatarY, avatar);
    const blockY = avatarY + avatar + LOOK.avatarGap;
    const blockH = LOOK.blockH[index];
    dc.fillRect(0, blockY, w, blockH, COLORS.panelTop);
    dc.frameRect(0, blockY, w, blockH, 1, COLORS.border);
    dc.fillRect(0, blockY, w, LOOK.edge, metal);
    let y = blockY + LOOK.blockPad;
    const centred = (str, height, style) => {
        oneLine(host, dc, str, { x: LOOK.blockPad, y, width: w - 2 * LOOK.blockPad, height, align: "center", ...style });
        y += height;
    };
    centred(String(place.rank), LOOK.rankH, { size: LOOK.rankSize, weight: 700, color: metal, font: FONTS.display });
    if (place.isTableRecord) centred(recordLabel, LOOK.recordH, { size: LOOK.recordSize, weight: 700, color: COLORS.gold, font: FONTS.display });
    centred(place.name, LOOK.nameH, { size: LOOK.nameSize, minSize: LOOK.minNameSize, weight: 600, color: place.isDefaultScore ? COLORS.dim : COLORS.title });
    centred(place.score, LOOK.scoreH, {
        size: place.isTableRecord ? LOOK.recordScoreSize : LOOK.scoreSize, minSize: LOOK.minScoreSize, weight: 700, color: place.isTableRecord ? LIGHT_GOLD : COLORS.title, font: FONTS.display,
    });
    centred(place.initials, LOOK.initialsH, { size: LOOK.initialsSize, weight: 600, color: COLORS.description, font: FONTS.display });
}

// A compact row, left to right: the rank's tile, the Avatar, the name,
// the initials, the score at the right end. A framed Avatar is smaller,
// centred on the same spot, so its frame stays within the row's height.
export function drawRow(host, dc, place, w) {
    const { rowH: h, rowPad: pad, tile, rowAvatar: avatar, cellGap: gap } = LOOK;
    dc.fillRect(0, 0, w, h, place.isDefaultScore ? COLORS.rowMissing : COLORS.rowUnlocked);
    const tileY = Math.round((h - tile) / 2);
    dc.fillRect(pad, tileY, tile, tile, COLORS.tile);
    dc.frameRect(pad, tileY, tile, tile, 1, COLORS.border);
    oneLine(host, dc, String(place.rank), { x: pad, y: tileY, width: tile, height: tile, size: LOOK.rowRankSize, weight: 700, color: COLORS.description, font: FONTS.display, align: "center" });
    const avatarX = pad + tile + gap;
    const size = place.framePath ? Math.min(avatar, Math.floor(h * h / avatarFrameSide(h))) : avatar;
    const shownX = avatarX + Math.round((avatar - size) / 2);
    const shownY = Math.round((h - size) / 2);
    drawAvatar(dc, place.avatarPath, shownX, shownY, size);
    drawAvatarFrame(dc, place.framePath, shownX, shownY, size);
    const scoreX = w - pad - LOOK.rowScoreW;
    const initialsX = scoreX - gap - LOOK.rowInitialsW;
    const nameX = avatarX + avatar + gap;
    oneLine(host, dc, place.name, {
        x: nameX, y: 0, width: initialsX - gap - nameX, height: h, size: LOOK.rowNameSize, minSize: LOOK.minNameSize, weight: 600,
        color: place.isDefaultScore ? COLORS.dim : COLORS.title,
    });
    oneLine(host, dc, place.initials, { x: initialsX, y: 0, width: LOOK.rowInitialsW, height: h, size: LOOK.rowInitialsSize, weight: 600, color: COLORS.description, font: FONTS.display, align: "center" });
    oneLine(host, dc, place.score, { x: scoreX, y: 0, width: LOOK.rowScoreW, height: h, size: LOOK.rowScoreSize, minSize: LOOK.minScoreSize, weight: 700, color: COLORS.title, font: FONTS.display, align: "right" });
}
