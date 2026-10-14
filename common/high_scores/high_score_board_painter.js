// ============================================================
// High Score Board painter: the layout and drawing of the High Score
// Board's pieces, in reference pixels (the window's height is
// REFERENCE_HEIGHT), on the Drawn Menu's panel and glass images: the
// table's title and a discreet note under it, then the podium (the 2nd
// place on the left, the 1st in the middle and highest, the 3rd on the
// right, room kept above each for its crown), then the places from the 4th on in compact rows; or a
// message in place of the board. Each Avatar wears its Profile's Avatar
// Frame, if any, as on the Profile Stats. Only drawing: no layer, no event,
// no side effect.
// ============================================================

import { STEAMBALL_COLORS as COLORS, STEAMBALL_FONTS as FONTS, RANK_COLORS } from "../drawing/steamball_palette.js";
import { oneLine, drawAvatar, drawAvatarFrame, avatarFrameSide } from "../drawing/steamball_drawing.js";
import { ACHIEVEMENT_RANK } from "../achievements/achievements.js";
import { DRAWN_MENU_IMAGES, DRAWN_MENU_IMAGES_FOLDER, DRAWN_MENU_PANEL_WIDTH, DRAWN_MENU_FACE_INSET, DRAWN_MENU_LIST_INSET } from "../drawn_menu/drawn_menu_images.js";

// Between the Household Stats and the Drawn Menus, which never show at the
// same time, so each reader sees only its own layers.
export const HIGH_SCORE_BOARD_Z_INDEX = Object.freeze({ backdrop: 6180, panel: 6181, title: 6182, note: 6183, message: 6184, podium: 6185, rows: 6186, glass: 6187 });

export const REFERENCE_HEIGHT = 1920;
// The places on the podium, the others in rows below it.
export const PODIUM_PLACES = 3;

// The 1st, 2nd and 3rd places' metal, as the crowns over them.
const METALS = [RANK_COLORS[ACHIEVEMENT_RANK.GOLD], RANK_COLORS[ACHIEVEMENT_RANK.SILVER], RANK_COLORS[ACHIEVEMENT_RANK.BRONZE]];
const LIGHT_GOLD = 0xFFFFE6A6;
const DIMMING = 0xB0080A0E;

const LOOK = Object.freeze({
    // From the panel's edges to the content, as the Drawn Menu's entries.
    sideInset: DRAWN_MENU_FACE_INSET + DRAWN_MENU_LIST_INSET, topInset: DRAWN_MENU_FACE_INSET + 40, bottomInset: DRAWN_MENU_FACE_INSET + 40,
    titleH: 84, titleSize: 34, minTitleSize: 22, noteH: 30, noteSize: 15, titleGap: 6,
    messageH: 200, messageSize: 26,
    // The podium's steps, the 1st's first: the crown's room, the Avatar,
    // the block under it; the steps stand on the same floor.
    stepGap: 14, crownH: [110, 84, 84], avatar: [120, 92, 92], avatarGap: 10, blockH: [210, 184, 164],
    edge: 4, blockPad: 10, rankH: 44, rankSize: 28, recordH: 24, recordSize: 14,
    nameH: 36, nameSize: 20, minNameSize: 14, scoreH: 40, scoreSize: 22, recordScoreSize: 26, initialsH: 28, initialsSize: 15,
    // The rows from the 4th place on.
    rowsGap: 18, rowH: 64, rowGap: 8, rowPad: 8, tile: 48, rowAvatar: 48, cellGap: 14, rowInitialsW: 80, rowScoreW: 200,
    rowRankSize: 18, rowNameSize: 18, rowInitialsSize: 15, rowScoreSize: 20,
});

// How wide an Avatar Frame is drawn at most, for its image's size.
export const AVATAR_FRAME_WIDTH = avatarFrameSide(Math.max(...LOOK.avatar, LOOK.rowAvatar));

const stepH = index => LOOK.crownH[index] + LOOK.avatar[index] + LOOK.avatarGap + LOOK.blockH[index];
const PODIUM_H = Math.max(...Array.from({ length: PODIUM_PLACES }, (_, index) => stepH(index)));

// The panel, the title, the note's line under it, then either the
// message's box or the podium's steps (the 1st's first, those with no
// place included) and one rect per row, in a window referenceWidth wide,
// for placeCount places.
export function layoutHighScoreBoard(referenceWidth, placeCount) {
    const w = DRAWN_MENU_PANEL_WIDTH;
    const rowCount = Math.max(0, placeCount - PODIUM_PLACES);
    const rowsH = rowCount === 0 ? 0 : LOOK.rowsGap + rowCount * LOOK.rowH + (rowCount - 1) * LOOK.rowGap;
    const bodyH = placeCount === 0 ? LOOK.messageH : PODIUM_H + rowsH;
    const minH = Math.max(
        DRAWN_MENU_IMAGES.panel.top.height + DRAWN_MENU_IMAGES.panel.bottom.height,
        DRAWN_MENU_IMAGES.glass.top.height + DRAWN_MENU_IMAGES.glass.bottom.height);
    const h = Math.max(minH, LOOK.topInset + LOOK.titleH + LOOK.noteH + LOOK.titleGap + bodyH + LOOK.bottomInset);
    // Not rounded across, so the 1st place stands on the window's middle.
    const panel = { x: (referenceWidth - w) / 2, y: Math.round((REFERENCE_HEIGHT - h) / 2), w, h };
    const x = panel.x + LOOK.sideInset;
    const contentW = w - 2 * LOOK.sideInset;
    const title = { x, y: panel.y + LOOK.topInset, w: contentW, h: LOOK.titleH };
    const note = { x, y: title.y + title.h, w: contentW, h: LOOK.noteH };
    const bodyY = note.y + note.h + LOOK.titleGap;
    const message = { x, y: bodyY, w: contentW, h: LOOK.messageH };
    const stepW = Math.floor((contentW - (PODIUM_PLACES - 1) * LOOK.stepGap) / PODIUM_PLACES);
    // The 1st centred on the panel, so it stands in the middle whatever the rounding.
    const middleX = panel.x + (w - stepW) / 2;
    const stepXs = [middleX, middleX - LOOK.stepGap - stepW, middleX + stepW + LOOK.stepGap];
    const steps = stepXs.map((stepX, index) => ({ x: stepX, y: bodyY + PODIUM_H - stepH(index), w: stepW, h: stepH(index) }));
    const rowsY = bodyY + PODIUM_H + LOOK.rowsGap;
    const rows = Array.from({ length: rowCount }, (_, index) => ({ x, y: rowsY + index * (LOOK.rowH + LOOK.rowGap), w: contentW, h: LOOK.rowH }));
    return { panel, title, note, message, steps, rows };
}

export function drawBackdrop(dc, { width, height }) {
    dc.fillRect(0, 0, width, height, DIMMING);
}

// A top, a middle stretched to the panel's height and a bottom, the panel
// w wide and h high.
function drawSlices(dc, folder, slices, w, h) {
    const path = slice => `${folder}\\${DRAWN_MENU_IMAGES_FOLDER}\\${slice.file}`;
    dc.drawImage(path(slices.top), 0, 0, w, slices.top.height);
    const middleH = h - slices.top.height - slices.bottom.height;
    if (middleH > 0) dc.drawImage(path(slices.middle), 0, slices.top.height, w, middleH);
    dc.drawImage(path(slices.bottom), 0, h - slices.bottom.height, w, slices.bottom.height);
}

// projectFolder: where the pack's assets\ folder is.
export const drawPanel = (dc, projectFolder, w, h) => drawSlices(dc, projectFolder, DRAWN_MENU_IMAGES.panel, w, h);
// Over the texts, as on the Drawn Menu.
export const drawGlass = (dc, projectFolder, w, h) => drawSlices(dc, projectFolder, DRAWN_MENU_IMAGES.glass, w, h);

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
// crown's room, the Avatar in its frame (reaching into the crown's room), then
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
        size: place.isTableRecord ? LOOK.recordScoreSize : LOOK.scoreSize, weight: 700, color: place.isTableRecord ? LIGHT_GOLD : COLORS.title, font: FONTS.display,
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
    oneLine(host, dc, place.score, { x: scoreX, y: 0, width: LOOK.rowScoreW, height: h, size: LOOK.rowScoreSize, weight: 700, color: COLORS.title, font: FONTS.display, align: "right" });
}
