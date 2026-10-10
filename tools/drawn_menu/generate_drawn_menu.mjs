// ============================================================
// Maintainer's tool, never loaded by PinballY. Paints the Drawn Menu look
// (prototype V4, "room lights", branch prototype/drawn-menu-styles) with
// the Avatar Frames' painting kit, at twice the size then halved, and
// writes, in assets/images/drawn_menu/, the images and sizes listed by
// common/drawn_menu_images.js: the panel (slate gradient, thin border,
// thin gold frame, square gold corners, soft gold glow from the top) and
// the glass laid over it (the room's lights out of focus: two warm spots
// top left, a cold one on the right, a neon along the top, a faint warm
// one at the bottom), each cut into a top, a stretchable middle and a
// bottom; and the chosen entry's glowing, pointed gold outline.
// Run: node tools/drawn_menu/generate_drawn_menu.mjs [--sheet], --sheet
// also writing sheet.png next to them (not committed): a short and a
// long menu built from the slices, to check by eye that they join
// without a seam.
// ============================================================

import path from "node:path";
import { fileURLToPath } from "node:url";
import { Canvas, clamp, mix, hex, sdPolygon } from "../avatar_frames/frame_kit.mjs";
import {
    DRAWN_MENU_IMAGES, DRAWN_MENU_FACE_INSET, DRAWN_MENU_LIST_INSET, DRAWN_MENU_LIST_WIDTH, DRAWN_MENU_SELECTION_MARGIN,
    DRAWN_MENU_ENTRY_HEIGHT,
} from "../../common/drawn_menu_images.js";
import { STEAMBALL_COLORS } from "../../common/steamball_palette.js";

const OUTPUT = fileURLToPath(new URL("../../assets/images/drawn_menu/", import.meta.url));
const SCALE = 2;
const { panel: PANEL, glass: GLASS, selection: SELECTION } = DRAWN_MENU_IMAGES;
const WIDTH = PANEL.top.width;

// A Steamball palette colour (0xAARRGGBB), as 0-1 RGB.
const rgbOf = argb => [(argb >>> 16) & 0xFF, (argb >>> 8) & 0xFF, argb & 0xFF].map(channel => channel / 255);
const SLATE_TOP = rgbOf(STEAMBALL_COLORS.panelTop);
const SLATE = rgbOf(STEAMBALL_COLORS.panel);
const BORDER = rgbOf(STEAMBALL_COLORS.border);
const GOLD = rgbOf(STEAMBALL_COLORS.gold);
const EDGE_LIGHT = hex("#ffe6a6");
const EDGE_HALO = hex("#ffd678");
const WHITE = [1, 1, 1];
const BLACK = [0, 0, 0];
// Where the slate gradient and the glow from the top end: within the top
// slice, shorter than the prototype's, so a menu of a single entry fits.
const GRADIENT_HEIGHT = 150;
const GLOW_HEIGHT = 165;
const CORNER = 28;
const CORNER_THICKNESS = 3;
// The corners stand out of the face's gold line by this much.
const CORNER_OUTSET = 1;
// From the face's gold frame to the first entry, in the sheet only.
const SHEET_LIST_TOP = 54;

const inside = (x, y, x0, y0, x1, y1) => x >= x0 && x < x1 && y >= y0 && y < y1;

// Every pixel of a slice the same way: paint(x, y) gives [r, g, b, a] or
// null, y counted from the top of the whole panel when fromTop, else from
// its bottom (negative), so the slices share one drawing.
function paintSlice({ width, height }, paint, { fromTop }) {
    const cv = Canvas.rect(width, height, SCALE);
    cv.field((x, y) => paint(x, fromTop ? y : y - height));
    return cv.half();
}

// ---------- Panel ----------

// The panel's colour at x, y (y < 0: from the bottom; middle rows use a
// y past the gradient and the glow, far from both ends).
function panelPixel(x, y, bottom) {
    const face = DRAWN_MENU_FACE_INSET;
    // The thin border around the whole panel.
    if (x < 1 || x >= WIDTH - 1 || (!bottom && y < 1) || (bottom && y >= -1)) return [...BORDER, 1];
    const slate = bottom ? SLATE : mixRGB(SLATE_TOP, SLATE, clamp(y / GRADIENT_HEIGHT));
    let color = slate;
    // The gold corners, square, standing out of the face's frame.
    const cornerLow = face - CORNER_OUTSET;
    const cornerHigh = cornerLow + CORNER;
    const xEdge = x < WIDTH / 2 ? x : WIDTH - 1 - x;
    const yEdge = bottom ? -1 - y : y;
    const onCornerArm = (xEdge >= cornerLow && xEdge < cornerHigh && yEdge >= cornerLow && yEdge < cornerLow + CORNER_THICKNESS)
        || (yEdge >= cornerLow && yEdge < cornerHigh && xEdge >= cornerLow && xEdge < cornerLow + CORNER_THICKNESS);
    if (onCornerArm) return [...GOLD, 1];
    // The face's thin gold frame, half see-through.
    const onFrame = (xEdge === face && yEdge >= face) || (yEdge === face && xEdge >= face);
    if (onFrame) color = mixRGB(color, GOLD, 0.5);
    if (!bottom && xEdge > face && y >= face - 1) color = addGlow(color, x, y);
    return [...color, 1];
}

const mixRGB = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

// The soft glow falling from the top of the face, and the light along its top edge.
function addGlow(color, x, y) {
    const face = DRAWN_MENU_FACE_INSET;
    const faceWidth = WIDTH - 2 * face;
    const dx = (x - WIDTH / 2) / (0.6 * faceWidth);
    const dy = (y - face) / GLOW_HEIGHT;
    const r = Math.hypot(dx, dy);
    const glow = r < 0.45 ? mix(0.095, 0.03, r / 0.45) : r < 0.78 ? mix(0.03, 0, (r - 0.45) / 0.33) : 0;
    let out = mixRGB(color, GOLD, glow);
    // A 2 px light on the frame's top (its gold line and the row below),
    // from 14 % to 86 % of the face, brightest in the middle, in a 10 px
    // halo that also fades past its ends.
    const start = face + 0.14 * faceWidth;
    const end = face + 0.86 * faceWidth;
    const across = y < face ? face - y : Math.max(0, y - face - 1);
    const beyond = Math.max(0, start - x, x - end);
    const distance = Math.hypot(across, beyond);
    if (distance < 10) out = mixRGB(out, EDGE_HALO, 0.25 * (1 - distance / 10) ** 2);
    if (distance === 0) out = mixRGB(out, EDGE_LIGHT, 0.7 * (1 - Math.abs((x - face) / faceWidth - 0.5) / 0.36));
    return out;
}

const paintPanel = () => ({
    top: paintSlice(PANEL.top, (x, y) => panelPixel(Math.floor(x), Math.floor(y), false), { fromTop: true }),
    // Past the gradient and the glow: every row the same.
    middle: paintSlice(PANEL.middle, x => panelPixel(Math.floor(x), PANEL.top.height + 1000, false), { fromTop: true }),
    bottom: paintSlice(PANEL.bottom, (x, y) => panelPixel(Math.floor(x), Math.floor(y), true), { fromTop: false }),
});

// ---------- Glass ----------

// A light reflected out of focus: alpha falling from core to 0 over radius,
// through middle at mid.
function spot(x, y, { cx, cy, color, core, mid = null, midAt = 0, radius }) {
    const d = Math.hypot(x - cx, y - cy);
    if (d >= radius) return 0;
    if (mid === null) return core * (1 - d / radius);
    return d < midAt ? mix(core, mid, d / midAt) : mix(mid, 0, (d - midAt) / (radius - midAt));
}

// Over-composites [color, alpha] layers, back to front, into [r, g, b, a].
function layered(layers) {
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;
    for (const [color, alpha] of layers) {
        if (alpha <= 0) continue;
        r = color[0] * alpha + r * (1 - alpha);
        g = color[1] * alpha + g * (1 - alpha);
        b = color[2] * alpha + b * (1 - alpha);
        a = alpha + a * (1 - alpha);
    }
    return a > 0 ? [r / a, g / a, b / a, a] : null;
}

const WARM = [1, 224 / 255, 170 / 255];
const COLD = [130 / 255, 200 / 255, 1];
const EMBER = [1, 140 / 255, 90 / 255];
// Where the room's lights fall: the prototype's, a little smaller and
// higher, so they fit the short top and bottom slices.
const TOP_LIGHTS = [
    { cx: 139, cy: 62, color: WARM, core: 0.075, mid: 0.03, midAt: 45, radius: 80 },
    { cx: 221, cy: 36, color: WHITE, core: 0.055, radius: 46 },
    { cx: 689, cy: 92, color: COLD, core: 0.05, mid: 0.02, midAt: 38, radius: 64 },
];
const BOTTOM_LIGHT = { cx: 607, cy: -40, color: EMBER, core: 0.04, radius: 50 };
// The neon's reflection near the top edge: a thin band rising 4 degrees
// to the right, fading in and out.
const NEON = { y: 30, rise: 10, fall: 15, alpha: 0.035, tilt: Math.tan(4 * Math.PI / 180) };

function neon(x, y) {
    const offset = y - NEON.y + (x - WIDTH / 2) * NEON.tilt;
    if (offset < -NEON.rise || offset > NEON.fall) return 0;
    return NEON.alpha * (offset < 0 ? 1 + offset / NEON.rise : 1 - offset / NEON.fall);
}

// The glass's edges catch the light at the top and left, darken at the bottom and right.
function edges(x, y, bottom) {
    const layers = [];
    if (x < 1) layers.push([WHITE, 0.04]);
    if (x >= WIDTH - 1) layers.push([BLACK, 0.3]);
    if (!bottom && y < 1) layers.push([WHITE, 0.1]);
    if (bottom && y >= -1) layers.push([BLACK, 0.45]);
    return layers;
}

const paintGlass = () => ({
    top: paintSlice(GLASS.top, (x, y) => layered([
        ...TOP_LIGHTS.map(light => [light.color, spot(x, y, light)]),
        [WHITE, neon(x, y)],
        ...edges(x, y, false),
    ]), { fromTop: true }),
    middle: paintSlice(GLASS.middle, x => layered(edges(x, GLASS.top.height + 1000, false)), { fromTop: true }),
    bottom: paintSlice(GLASS.bottom, (x, y) => layered([[BOTTOM_LIGHT.color, spot(x, y, BOTTOM_LIGHT)], ...edges(x, y, true)]), { fromTop: false }),
});

// ---------- Selection ----------

// erf, to 1e-7 (Abramowitz and Stegun 7.1.26).
function erf(value) {
    const sign = Math.sign(value);
    const t = 1 / (1 + 0.3275911 * Math.abs(value));
    const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
    return sign * (1 - poly * Math.exp(-value * value));
}

// The prototype's pointed outline: a gold line 2.5 px wide over a faint
// gold fill, and a 6 px line blurred by 7 px behind it for the glow.
function paintSelection() {
    const margin = DRAWN_MENU_SELECTION_MARGIN;
    const width = DRAWN_MENU_LIST_WIDTH;
    const height = DRAWN_MENU_ENTRY_HEIGHT;
    const tip = 24;
    const points = [[tip, 0], [width - tip, 0], [width, height / 2], [width - tip, height], [tip, height], [0, height / 2]]
        .map(([x, y]) => [x + margin, y + margin]);
    const cv = Canvas.rect(SELECTION.width, SELECTION.height, SCALE);
    const blur = 7 * Math.SQRT2;
    cv.field((x, y) => {
        const d = sdPolygon(x, y, points);
        const glow = 0.55 * 0.5 * (erf((Math.abs(d) + 3) / blur) - erf((Math.abs(d) - 3) / blur));
        const fill = d < 0 ? 0.12 * clamp(0.5 - d / cv.px) : 0;
        const line = clamp(0.5 - (Math.abs(d) - 1.25) / cv.px);
        return layered([[GOLD, glow], [GOLD, fill], [GOLD, line]]);
    });
    return cv.half();
}

// ---------- Sheet ----------

// Over-composites a premultiplied canvas onto the sheet, rows picked by rowOf.
function blit(sheet, source, dx, dy, rows, rowOf) {
    for (let j = 0; j < rows; j++) {
        const sj = rowOf(j);
        for (let i = 0; i < source.size; i++) {
            const s = (sj * source.size + i) * 4;
            const o = ((dy + j) * sheet.size + dx + i) * 4;
            const keep = 1 - source.buf[s + 3];
            for (let c = 0; c < 4; c++) sheet.buf[o + c] = source.buf[s + c] + sheet.buf[o + c] * keep;
        }
    }
}

// A menu of that height from the three slices of a set.
function blitStack(sheet, set, dx, dy, height) {
    const middleRows = height - set.top.height - set.bottom.height;
    blit(sheet, set.top, dx, dy, set.top.height, j => j);
    blit(sheet, set.middle, dx, dy + set.top.height, middleRows, j => j % set.middle.height);
    blit(sheet, set.bottom, dx, dy + height - set.bottom.height, set.bottom.height, j => j);
}

function writeSheet(panel, glass, selection) {
    const heights = [250, 900];
    const gap = 60;
    const sheet = Canvas.rect(heights.length * (WIDTH + gap) + gap, Math.max(...heights) + 2 * gap);
    sheet.field(() => [...hex("#0b0e14"), 1]);
    heights.forEach((height, index) => {
        const dx = gap + index * (WIDTH + gap);
        blitStack(sheet, panel, dx, gap, height);
        const listTop = gap + DRAWN_MENU_FACE_INSET + SHEET_LIST_TOP;
        blit(sheet, selection, dx + DRAWN_MENU_FACE_INSET + DRAWN_MENU_LIST_INSET - DRAWN_MENU_SELECTION_MARGIN, listTop - DRAWN_MENU_SELECTION_MARGIN,
            selection.height, j => j);
        blitStack(sheet, glass, dx, gap, height);
    });
    sheet.save(path.join(OUTPUT, "sheet.png"));
}

const started = Date.now();
const panel = paintPanel();
const glass = paintGlass();
const selection = paintSelection();
for (const [set, images] of [[panel, PANEL], [glass, GLASS]]) {
    for (const part of ["top", "middle", "bottom"]) set[part].save(path.join(OUTPUT, images[part].file));
}
selection.save(path.join(OUTPUT, SELECTION.file));
if (process.argv.includes("--sheet")) writeSheet(panel, glass, selection);
console.log(`Drawn Menu images painted in ${Date.now() - started} ms.`);
