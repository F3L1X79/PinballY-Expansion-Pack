// ============================================================
// Achievement List painter: draws the pieces of the drawn Achievement List
// (the dimmed backdrop and panel, the header and footer, a section header,
// an Achievement row, a rank emblem, a row's Unlock Rate, an emblem image,
// the scrollbar's rail and thumb)
// into a drawing layer's context, in the Steamball look validated with the
// prototype, and says where the pieces on layers of their own sit. It only
// draws what it is given: it holds no state, reads no Achievement and
// listens to no event. Sizes are in layout pixels, fonts in points.
// ============================================================

import { ACHIEVEMENT_RANK, RANKS_IN_ORDER } from "./achievements.js";
import { STEAMBALL_COLORS as COLORS, STEAMBALL_FONTS as FONTS, RANK_COLORS } from "./steamball_palette.js";
import { drawAvatarFrame, avatarFrameSide, avatarFrameInset } from "./steamball_drawing.js";

// The wheel shows dimmed through it.
const OVERLAY_COLOR = 0xD0080A0E;
// The footer's gradient top, a step lighter than the panel.
const FOOTER_TOP_COLOR = 0xFF1C2330;
const HEADER_BOTTOM_COLOR = 0xFF222B3A;
const BLACK = 0xFF000000;
// The gem in the middle of each rank's emblem.
const RANK_GEMS = Object.freeze({
    [ACHIEVEMENT_RANK.BRONZE]: 0xFFF0B27A,
    [ACHIEVEMENT_RANK.SILVER]: 0xFFE8F0F8,
    [ACHIEVEMENT_RANK.GOLD]: 0xFFFFE27A,
    [ACHIEVEMENT_RANK.PLATINUM]: 0xFF7FF6FF,
});

export const LIST_LOOK = Object.freeze({
    panelRatio: 0.75,
    headerHeight: 180,
    footerHeight: 112,
    rowHeight: 100,
    sectionHeight: 52,
    // Between two items of the list.
    itemGap: 8,
    // Between the panel's sides and the rows.
    rowsInset: 16,
    padding: 24,
    avatarSize: 104,
    gaugeHeight: 7,
    gaugeTipRadius: 10,
    rankEdgeWidth: 4,
    emblemCenterX: 52,
    // The square canvas of an emblem image: its emblem is about as tall as
    // the drawn one.
    emblemImageSize: 96,
    // The header's small emblems, next to their count.
    headerEmblemScale: 0.45,
    headerEmblemImageSize: 44,
    // A rank's small emblem and its count, side by side.
    rankCountWidth: 76,
    rankCountTextLeft: 38,
    textLeft: 102,
    progressBarHeight: 6,
    progressBarMaxWidth: 320,
    // Wide enough for an hours text such as "12.5/100 h".
    progressTextWidth: 100,
    // Kept free on the right of a row's texts for the Unlock Rate.
    ownersWidth: 220,
    ownerAvatarSize: 36,
    ownerGap: 4,
    // Between the Unlock Rate and the row's right edge.
    ownersInset: 12,
    // The scrollbar, centred in the panel's right margin: a gold thumb in
    // a soft glow, over a thin rail with a small diamond at each end.
    scrollbarThumbWidth: 6,
    scrollbarGlow: 2,
    scrollbarRailWidth: 2,
    scrollbarCapRadius: 3,
    // Between the rail's ends and the header or the footer.
    scrollbarInset: 10,
    scrollbarMinThumbHeight: 40,
});

function mixColors(from, to, ratio) {
    let color = 0;
    for (const shift of [24, 16, 8, 0]) {
        const start = (from >>> shift) & 0xFF;
        const end = (to >>> shift) & 0xFF;
        color += Math.round(start + (end - start) * ratio) * 2 ** shift;
    }
    return color;
}

// In 4-pixel bands: the drawing context has no gradient fill, and bands
// keep a tall gradient cheap.
function fillGradient(dc, x, y, width, height, topColor, bottomColor) {
    for (let row = 0; row < height; row += 4) {
        const ratio = row / Math.max(1, height - 1);
        dc.fillRect(x, y + row, width, Math.min(4, height - row), mixColors(topColor, bottomColor, ratio));
    }
}

// A diamond centred on (centerX, centerY), drawn as stacked lines.
function fillDiamond(dc, centerX, centerY, radius, color) {
    for (let dy = -radius; dy <= radius; dy++) {
        const half = radius - Math.abs(dy);
        dc.fillRect(Math.round(centerX - half), Math.round(centerY + dy), 2 * half + 1, 1, color);
    }
}

const withAlpha = (color, alpha) => alpha * 2 ** 24 + (color & 0xFFFFFF);

// How far a rounded corner eats into line i (0 = top line) of a shape.
function cornerInset(radius, i) {
    return Math.round(radius - Math.sqrt(radius * radius - (radius - i - 0.5) ** 2));
}

// A vertical capsule (both ends rounded), drawn line by line.
function fillCapsule(dc, x, y, width, height, color) {
    const radius = width / 2;
    for (let i = 0; i < height; i++) {
        const fromEnd = Math.min(i, height - 1 - i);
        const inset = fromEnd < radius ? cornerInset(radius, fromEnd) : 0;
        dc.fillRect(x + inset, y + i, width - 2 * inset, 1, color);
    }
}

// A disc centred on (centerX, centerY), drawn line by line.
function fillDisc(dc, centerX, centerY, radius, color) {
    for (let i = 0; i < 2 * radius; i++) {
        const inset = cornerInset(radius, Math.min(i, 2 * radius - 1 - i));
        dc.fillRect(centerX - radius + inset, centerY - radius + i, 2 * (radius - inset), 1, color);
    }
}

// A rank emblem in the spirit of League of Legends' season 2 badges,
// centred on (centerX, centerY), about 64 pixels tall at scale 1: a pointed
// shield with a gem and a crest, and wings growing with the rank. Unlocked,
// it is in the rank's colour, and with a halo it gets a glow growing with
// the rank, plus sparkles for Platinum; missing, it is muted and never has
// a halo. The list's rows and header draw it without its halo.
export function drawRankEmblem(dc, centerX, centerY, { rank, unlocked, halo = false, scale = 1 }) {
    const px = value => Math.round(value * scale);
    const rankIndex = RANKS_IN_ORDER.indexOf(rank);
    const rankColor = RANK_COLORS[rank];
    const base = unlocked ? rankColor : mixColors(rankColor, COLORS.tile, 0.65);
    const light = mixColors(base, COLORS.title, unlocked ? 0.5 : 0.1);
    const shade = mixColors(base, BLACK, 0.4);
    if (unlocked && halo) {
        // Stacked translucent discs, wider and brighter by rank.
        const radius = px(26 + 6 * rankIndex);
        const steps = 3 + 2 * rankIndex;
        for (let step = steps; step >= 1; step--) {
            fillDisc(dc, centerX, centerY, Math.round(radius * step / steps), withAlpha(rankColor, 0x0A + 3 * rankIndex));
        }
    }
    // One feather per rank and one more, longer as the rank rises.
    for (let feather = 0; feather <= rankIndex; feather++) {
        const length = px(10 + 4 * rankIndex - 2 * feather);
        const startY = centerY + px(-9 + 6 * feather);
        for (let step = 0; step <= length; step++) {
            const color = mixColors(light, shade, step / Math.max(1, length));
            const lift = Math.round(step * (0.9 - 0.15 * feather));
            dc.fillRect(centerX - px(15) - step, startY - lift, 1, Math.max(1, px(4)), color);
            dc.fillRect(centerX + px(15) + step, startY - lift, 1, Math.max(1, px(4)), color);
        }
    }
    const crestHeight = px(9);
    for (let i = 0; i < crestHeight; i++) {
        const half = Math.floor(i / 2);
        dc.fillRect(centerX - half, centerY - px(26) + i, 2 * half + 1, 1, light);
    }
    // Straight sides, then a point; bevelled, lit on the left.
    const shieldHeight = px(40);
    const shieldTop = centerY - px(18);
    const bevel = Math.max(1, px(3));
    for (let i = 0; i < shieldHeight; i++) {
        const ratio = i / shieldHeight;
        const half = Math.round(px(16) * (ratio < 0.55 ? 1 : 1 - (ratio - 0.55) / 0.45));
        if (half <= 0) continue;
        dc.fillRect(centerX - half, shieldTop + i, half, 1, light);
        dc.fillRect(centerX, shieldTop + i, half, 1, base);
        const inner = half - bevel;
        if (inner > 0 && i >= bevel) {
            dc.fillRect(centerX - inner, shieldTop + i, inner, 1, mixColors(shade, COLORS.tile, 0.5));
            dc.fillRect(centerX, shieldTop + i, inner, 1, mixColors(shade, COLORS.tile, 0.7));
        }
    }
    const gem = unlocked ? RANK_GEMS[rank] : mixColors(RANK_GEMS[rank], COLORS.tile, 0.7);
    fillDiamond(dc, centerX, centerY + px(1), px(9), mixColors(gem, BLACK, 0.35));
    fillDiamond(dc, centerX, centerY + px(1), px(6), gem);
    if (!unlocked) return;
    fillDiamond(dc, centerX - px(2), centerY - px(2), px(2), COLORS.title);
    if (halo && rank === ACHIEVEMENT_RANK.PLATINUM) {
        for (const [dx, dy, radius] of [[-30, -22, 3], [31, -18, 2], [-26, 24, 2], [28, 23, 3], [0, -38, 2]]) {
            fillDiamond(dc, centerX + px(dx), centerY + px(dy), px(radius), COLORS.title);
        }
    }
}

// The weight always has a value: PinballY rejects a textStyle whose weight
// is present but undefined ("Error creating styled text layout").
function drawText(host, dc, runs, { x, y, width, font = FONTS.body, size, weight = 400, color }) {
    const text = host.createStyledText({ textStyle: { font, size, weight, color } });
    for (const run of runs) text.add(run);
    const measured = text.measure(width);
    text.draw(dc, { x, y, width, height: measured.height });
    return measured;
}

// Where the panel, the header, the rows area and the footer sit in a
// window of this size.
export function computeGeometry({ width, height }) {
    const look = LIST_LOOK;
    const panelWidth = Math.round(width * look.panelRatio);
    const panelHeight = Math.round(height * look.panelRatio);
    const x = Math.round((width - panelWidth) / 2);
    const y = Math.round((height - panelHeight) / 2);
    return {
        width, height, x, y, panelWidth, panelHeight,
        areaTop: y + look.headerHeight,
        areaHeight: panelHeight - look.headerHeight - look.footerHeight,
        rowX: x + look.rowsInset,
        rowWidth: panelWidth - 2 * look.rowsInset,
    };
}

// The whole window: the dimmed wheel, then the panel.
export function drawBackdrop(dc, g) {
    dc.fillRect(0, 0, g.width, g.height, OVERLAY_COLOR);
    dc.fillRect(g.x, g.y, g.panelWidth, g.panelHeight, COLORS.panel);
    dc.frameRect(g.x, g.y, g.panelWidth, g.panelHeight, 1, COLORS.border);
}

// How wide the header's Avatar Frame is drawn, for its image's size.
export const AVATAR_FRAME_WIDTH = avatarFrameSide(LIST_LOOK.avatarSize);

// Where the header's Avatar and texts sit, and where its rank counts start;
// inset: the Avatar Frame's margin around the Avatar, 0 without one.
function headerLayout(g, rankCountsLength, inset = 0) {
    const look = LIST_LOOK;
    const avatarX = g.x + look.padding + inset;
    const avatarY = g.y + (look.headerHeight - look.avatarSize) / 2;
    const textX = avatarX + look.avatarSize + inset + 28;
    const textWidth = g.panelWidth - (textX - g.x) - look.padding - 8;
    const rankCountsWidth = rankCountsLength * look.rankCountWidth;
    return { avatarX, avatarY, textX, textWidth, rankCountsWidth, rankCountsX: textX + textWidth - rankCountsWidth };
}

// Where the index-th rank count starts: its emblem, then its count.
const rankCountLeft = (layout, index) => layout.rankCountsX + index * LIST_LOOK.rankCountWidth;

// Centred on the Profile name's line, left of the rank's count.
const headerEmblemCenter = (layout, index) => ({
    x: rankCountLeft(layout, index) + LIST_LOOK.rankCountTextLeft / 2,
    y: layout.avatarY + 36,
});

// The header's emblem images, each on a layer of its own over the mask:
// for each rank count with an image ({ rank, imagePath }), its box in the
// window.
export function layoutHeaderEmblems(g, rankCounts) {
    const layout = headerLayout(g, rankCounts.length);
    const size = LIST_LOOK.headerEmblemImageSize;
    return rankCounts.flatMap(({ rank, imagePath }, index) => {
        if (!imagePath) return [];
        const center = headerEmblemCenter(layout, index);
        return [{ rank, imagePath, x: center.x - size / 2, y: center.y - size / 2, width: size, height: size }];
    });
}

// The Avatar in its worn Avatar Frame (in a double gold frame without one), the title, the Profile's name, the
// total line and its gauge, with a diamond at the gauge's tip; on the
// name's line, right-aligned, the count of Unlocked Achievements of each
// rank after its small emblem, drawn here only for a rank without an
// emblem image.
function drawHeader(host, dc, g, header) {
    const look = LIST_LOOK;
    const { x, y, panelWidth: width } = g;
    fillGradient(dc, x, y, width, look.headerHeight, COLORS.panelTop, HEADER_BOTTOM_COLOR);
    const avatar = look.avatarSize;
    const layout = headerLayout(g, header.rankCounts.length, avatarFrameInset(header.framePath, avatar));
    const { avatarX, avatarY, textX, textWidth, rankCountsWidth } = layout;
    if (header.framePath) {
        dc.drawImage(header.avatarPath, avatarX, avatarY, avatar, avatar);
        drawAvatarFrame(dc, header.framePath, avatarX, avatarY, avatar);
    } else {
        dc.fillRect(avatarX - 7, avatarY - 7, avatar + 14, avatar + 14, COLORS.gold);
        dc.fillRect(avatarX - 4, avatarY - 4, avatar + 8, avatar + 8, COLORS.tile);
        dc.frameRect(avatarX - 2, avatarY - 2, avatar + 4, avatar + 4, 1, COLORS.gold);
        dc.drawImage(header.avatarPath, avatarX, avatarY, avatar, avatar);
    }

    // Only the title and the name share their width with the rank counts.
    const nameSize = drawText(host, dc, [
        { size: 11, weight: 600, color: COLORS.gold, text: `${header.title}\n` },
        { size: 20, weight: 600, color: COLORS.title, text: header.profileName },
    ], { x: textX, y: avatarY + 2, width: textWidth - rankCountsWidth, size: 12, color: COLORS.description });
    drawText(host, dc, [header.totalLine], { x: textX, y: avatarY + 2 + nameSize.height, width: textWidth, size: 12, color: COLORS.description });

    header.rankCounts.forEach(({ rank, count, imagePath }, index) => {
        const center = headerEmblemCenter(layout, index);
        if (!imagePath) drawRankEmblem(dc, center.x, center.y, { rank, unlocked: true, scale: look.headerEmblemScale });
        drawText(host, dc, [count], {
            x: rankCountLeft(layout, index) + look.rankCountTextLeft, y: avatarY + 24,
            width: look.rankCountWidth - look.rankCountTextLeft, size: 13, weight: 600, color: COLORS.title,
        });
    });

    // The empty part as tall as the filled one, so the gauge reads as one bar.
    const gaugeY = avatarY + avatar - 10;
    const filled = Math.round(textWidth * header.ratio);
    dc.fillRect(textX, gaugeY, textWidth, look.gaugeHeight, COLORS.track);
    dc.fillRect(textX, gaugeY, filled, look.gaugeHeight, COLORS.gold);
    dc.fillRect(textX, gaugeY, filled, 1, mixColors(COLORS.gold, COLORS.title, 0.5));
    const tipY = gaugeY + Math.floor(look.gaugeHeight / 2);
    fillDiamond(dc, textX + filled, tipY, look.gaugeTipRadius, COLORS.gold);
    fillDiamond(dc, textX + filled, tipY, 4, COLORS.title);
    dc.fillRect(x, y + look.headerHeight - 1, width, 1, COLORS.border);
}

// Centred like a console's hints: key caps, then what they do.
function drawFooter(host, dc, g, footer) {
    const look = LIST_LOOK;
    const { x, panelWidth: width } = g;
    const y = g.y + g.panelHeight - look.footerHeight;
    fillGradient(dc, x, y, width, look.footerHeight, FOOTER_TOP_COLOR, COLORS.panel);
    dc.fillRect(x, y, width, 1, COLORS.border);

    const keyCap = () => host.createStyledText({
        backgroundColor: COLORS.keyCap, cornerRadius: 6, padding: 8,
        textStyle: { font: FONTS.display, size: 15, weight: 700, color: COLORS.title },
    });
    const label = () => host.createStyledText({ textStyle: { font: FONTS.display, size: 18, weight: 600, color: COLORS.description } });
    const pieces = [
        { key: footer.prevKey }, { gap: 8 }, { key: footer.nextKey }, { gap: 12 }, { label: footer.browse },
        { gap: 48 },
        { key: footer.exitKey }, { gap: 12 }, { label: footer.back },
    ].map(piece => {
        if (piece.gap) return piece;
        const text = piece.key === undefined ? label() : keyCap();
        text.add(piece.key === undefined ? piece.label : piece.key);
        const size = text.measure(width);
        return { text, width: size.width, height: size.height };
    });
    const total = pieces.reduce((sum, piece) => sum + (piece.gap || piece.width), 0);
    let pieceX = x + (width - total) / 2;
    for (const piece of pieces) {
        if (piece.gap) {
            pieceX += piece.gap;
            continue;
        }
        // A little wider than measured, so the last letter never wraps.
        piece.text.draw(dc, { x: pieceX, y: y + (look.footerHeight - piece.height) / 2, width: piece.width + 2, height: piece.height });
        pieceX += piece.width;
    }
}

// The whole window, transparent between the header and the footer, so a
// row sliding out of the rows area hides under them; the scrollbar's rail
// when the list overflows (scrollbar from layoutScrollbar(), or null).
export function drawMask(host, dc, g, { header, footer, scrollbar }) {
    drawHeader(host, dc, g, header);
    drawFooter(host, dc, g, footer);
    if (scrollbar) drawScrollbarRail(dc, scrollbar);
}

// The scrollbar of a list this tall, or null when it fits in the rows
// area: the rail's centre and extent in the window, the thumb's layer size
// and how far the list scrolls.
export function layoutScrollbar(g, listHeight) {
    const look = LIST_LOOK;
    if (listHeight <= g.areaHeight) return null;
    const top = g.areaTop + look.scrollbarInset;
    const height = g.areaHeight - 2 * look.scrollbarInset;
    return {
        centerX: g.x + g.panelWidth - look.rowsInset / 2,
        top,
        height,
        thumbWidth: look.scrollbarThumbWidth + 2 * look.scrollbarGlow,
        // Never taller than the rail, even in a tiny window.
        thumbHeight: Math.min(height, Math.max(look.scrollbarMinThumbHeight, Math.round(height * g.areaHeight / listHeight))),
        maxScroll: listHeight - g.areaHeight,
    };
}

// The thumb's top in the window for this scroll.
export function thumbTopAt(bar, scroll) {
    const ratio = Math.min(1, Math.max(0, scroll / bar.maxScroll));
    return bar.top + (bar.height - bar.thumbHeight) * ratio;
}

// The rail, on the mask: it never moves.
function drawScrollbarRail(dc, bar) {
    const look = LIST_LOOK;
    const centerX = Math.round(bar.centerX);
    dc.fillRect(centerX - look.scrollbarRailWidth / 2, bar.top, look.scrollbarRailWidth, bar.height, COLORS.track);
    for (const capY of [bar.top, bar.top + bar.height]) {
        fillDiamond(dc, centerX, capY, look.scrollbarCapRadius, COLORS.gold);
        fillDiamond(dc, centerX, capY, 1, COLORS.title);
    }
}

// The thumb on its own layer, at the layer's size: a gold capsule in a
// soft glow, lit along its left side like the header's gauge.
export function drawScrollbarThumb(dc, width, height) {
    const glow = LIST_LOOK.scrollbarGlow;
    fillCapsule(dc, 0, 0, width, height, withAlpha(COLORS.gold, 0x40));
    fillCapsule(dc, glow, glow, width - 2 * glow, height - 2 * glow, COLORS.gold);
    const bodyRadius = (width - 2 * glow) / 2;
    dc.fillRect(glow + 1, glow + bodyRadius, 1, Math.max(0, height - 2 * glow - 2 * bodyRadius), mixColors(COLORS.gold, COLORS.title, 0.5));
}

// Its title in gold, the count beside it, and a rule to the right edge.
export function drawSectionHeader(host, dc, width, { title, count }) {
    const style = { font: FONTS.display, size: 17 };
    // Measured on the title itself: PinballY cannot lay out an empty text
    // (it logs an error and measures it 0 high).
    const probe = host.createStyledText({ textStyle: { ...style, weight: 700 } });
    probe.add(title);
    const textY = LIST_LOOK.sectionHeight - 8 - probe.measure(width).height;
    const titleSize = drawText(host, dc, [title], { ...style, x: 6, y: textY, width, weight: 700, color: COLORS.gold });
    const countX = 6 + titleSize.width + 10;
    const countSize = drawText(host, dc, [count], { ...style, x: countX, y: textY, width: width - countX, weight: 400, color: COLORS.description });
    const ruleX = countX + countSize.width + 16;
    dc.fillRect(ruleX, textY + titleSize.height / 2, Math.max(0, width - ruleX - 6), 1, COLORS.border);
}

// An Achievement's row: its background, its rank emblem unless it has an
// emblem image (on a layer of its own, see layoutRowEmblem()), its rank's
// colour on the left edge when Unlocked, its title and description, and
// when it has an Achievement Progress ({ text, ratio }) a gold bar with its
// short text.
export function drawRow(host, dc, width, { title, description, rank, unlocked, hasEmblemImage, progress }) {
    const look = LIST_LOOK;
    dc.fillRect(0, 0, width, look.rowHeight, unlocked ? COLORS.rowUnlocked : COLORS.rowMissing);
    if (unlocked) dc.fillRect(0, 0, look.rankEdgeWidth, look.rowHeight, RANK_COLORS[rank]);
    if (!hasEmblemImage) drawRankEmblem(dc, look.emblemCenterX, look.rowHeight / 2, { rank, unlocked });
    const textWidth = width - look.textLeft - look.ownersWidth;
    const reserved = progress ? 14 : 0;
    const text = host.createStyledText({ textStyle: { font: FONTS.body, size: 11, color: unlocked ? COLORS.description : COLORS.dim } });
    text.add({ size: 13, weight: 600, color: unlocked ? COLORS.title : COLORS.description, text: `${title}\n` });
    text.add(description);
    const height = text.measure(textWidth).height;
    const textY = (look.rowHeight - height - reserved) / 2;
    text.draw(dc, { x: look.textLeft, y: textY, width: textWidth, height });
    if (progress) {
        const barY = textY + height + 8;
        const barWidth = Math.min(textWidth - look.progressTextWidth, look.progressBarMaxWidth);
        const filled = Math.round(barWidth * Math.min(1, Math.max(0, progress.ratio)));
        dc.fillRect(look.textLeft, barY, barWidth, look.progressBarHeight, COLORS.track);
        if (filled > 0) dc.fillRect(look.textLeft, barY, filled, look.progressBarHeight, COLORS.gold);
        drawText(host, dc, [progress.text], {
            x: look.textLeft + barWidth + 10, y: barY - 7, width: look.progressTextWidth - 10, size: 10, color: COLORS.description,
        });
    }
}

// A row's Unlock Rate, right-aligned in the row's right part (ownersWidth
// by rowHeight): the Avatars of the other Profiles that have the
// Achievement, then the "+N" pill when there are more. Each piece sits on
// a small layer of its own, so an Avatar drawn once serves every row:
// returns the pieces, each with its box in the row's right part.
export function layoutOwners(host, { avatarPaths, moreText }) {
    const look = LIST_LOOK;
    const size = look.ownerAvatarSize;
    const pill = moreText === null ? null : { moreText, ...pillText(host, moreText).measure(look.ownersWidth) };
    // A little wider than measured, so the last digit never wraps.
    const pillWidth = pill ? pill.width + 2 : 0;
    let x = look.ownersWidth - look.ownersInset - avatarPaths.length * (size + look.ownerGap) - pillWidth;
    const pieces = avatarPaths.map(avatarPath => {
        const piece = { avatarPath, x: x - 1, y: (look.rowHeight - size) / 2 - 1, width: size + 2, height: size + 2 };
        x += size + look.ownerGap;
        return piece;
    });
    if (pill) pieces.push({ moreText, x, y: (look.rowHeight - pill.height) / 2, width: pillWidth, height: pill.height });
    return pieces;
}

// The pill is opaque: StyledText ignores a semi-transparent background.
function pillText(host, moreText) {
    const text = host.createStyledText({
        backgroundColor: COLORS.keyCap, cornerRadius: 9, padding: 5,
        textStyle: { font: FONTS.display, size: 11, weight: 700, color: COLORS.title },
    });
    text.add(moreText);
    return text;
}

// A row's emblem image, in place of the drawn emblem: its box in the row.
export function layoutRowEmblem(imagePath) {
    const size = LIST_LOOK.emblemImageSize;
    return { imagePath, x: LIST_LOOK.emblemCenterX - size / 2, y: (LIST_LOOK.rowHeight - size) / 2, width: size, height: size };
}

// A piece on its own layer, at the piece's size: an emblem image (from
// layoutRowEmblem() or layoutHeaderEmblems()), or one of layoutOwners():
// an Avatar in its thin frame, or the "+N" pill.
export function drawPiece(host, dc, { imagePath, avatarPath, moreText, width, height }) {
    if (imagePath !== undefined) {
        dc.drawImage(imagePath, 0, 0, width, height);
        return;
    }
    if (moreText !== undefined) {
        pillText(host, moreText).draw(dc, { x: 0, y: 0, width, height });
        return;
    }
    dc.fillRect(0, 0, width, height, COLORS.border);
    dc.drawImage(avatarPath, 1, 1, width - 2, height - 2);
}
