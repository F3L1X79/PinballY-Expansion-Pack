// ============================================================
// Maintainer's tool, never loaded by PinballY. Paints the Loader's gold
// comet from the Steamball golds: a white-gold head with a soft glow and
// a tail of 300 degrees that thins and fades from gold to bronze,
// turning clockwise.
// Writes it as a looping APNG with alpha, at the place, size and frame
// count given by common/drawing/loader_image.js, through its own small
// APNG encoder on Node's zlib.
// Run: node maintainer/loader/generate_loader.mjs
// ============================================================

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { LOADER_IMAGE } from "../../common/drawing/loader_image.js";
import { STEAMBALL_COLORS } from "../../common/drawing/steamball_palette.js";

const OUTPUT = fileURLToPath(new URL(`../../${LOADER_IMAGE.folder.replace(/\\/g, "/")}/${LOADER_IMAGE.file}`, import.meta.url));
const SIZE = LOADER_IMAGE.width;
// 2 x 2 samples a pixel, for smooth edges.
const SAMPLES = 2;
const TAU = Math.PI * 2;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const TRUECOLOR_WITH_ALPHA = 6;

// A Steamball palette colour (0xAARRGGBB), as 0-1 RGB.
const rgbOf = argb => [(argb >>> 16) & 0xFF, (argb >>> 8) & 0xFF, argb & 0xFF].map(channel => channel / 255);
const GLEAM = rgbOf(STEAMBALL_COLORS.gleam);
const LIGHT_GOLD = rgbOf(STEAMBALL_COLORS.lightGold);
const GOLD = rgbOf(STEAMBALL_COLORS.gold);
const BRONZE = rgbOf(STEAMBALL_COLORS.bronze);
const TAIL_RAMP = [[0, GLEAM], [0.12, LIGHT_GOLD], [0.45, GOLD], [1, BRONZE]];

const CENTRE = SIZE / 2;
const RADIUS = SIZE * 0.38;
const STROKE_WIDTH = SIZE * 0.075;
const TAIL_LENGTH = TAU * 300 / 360;

const clamp = (value, low = 0, high = 1) => (value < low ? low : value > high ? high : value);
const mix = (a, b, t) => a.map((value, i) => value + (b[i] - value) * t);
const mod = (a, n) => ((a % n) + n) % n;
// How much of a pixel a shape covers, from its signed distance.
const coverage = signedDistance => clamp(0.5 - signedDistance);

function ramp(stops, t) {
    for (let i = 1; i < stops.length; i++) {
        const [t1, c1] = stops[i];
        const [t0, c0] = stops[i - 1];
        if (t <= t1) return mix(c0, c1, (t - t0) / (t1 - t0));
    }
    return stops[stops.length - 1][1];
}

// The layers of one point, back to front, as [rgb, alpha], with the head
// at the angle TAU * t (y pointing down: clockwise).
function cometLayers(x, y, t) {
    const head = TAU * t;
    const r = Math.hypot(x - CENTRE, y - CENTRE);
    const behind = mod(head - Math.atan2(y - CENTRE, x - CENTRE), TAU);
    const toHead = Math.hypot(x - (CENTRE + RADIUS * Math.cos(head)), y - (CENTRE + RADIUS * Math.sin(head)));
    const layers = [[LIGHT_GOLD, 0.45 * Math.exp(-((toHead / (1.6 * STROKE_WIDTH)) ** 2))]];
    if (behind <= TAIL_LENGTH) {
        const b = behind / TAIL_LENGTH;
        const width = STROKE_WIDTH * (1 - 0.85 * b);
        layers.push([ramp(TAIL_RAMP, b), (1 - b) ** 1.6 * coverage(Math.abs(r - RADIUS) - width / 2)]);
    }
    layers.push([GLEAM, coverage(toHead - 0.62 * STROKE_WIDTH)]);
    return layers;
}

// One frame as straight (not premultiplied) RGBA bytes.
function paintFrame(t) {
    const pixels = Buffer.alloc(SIZE * SIZE * 4);
    for (let py = 0; py < SIZE; py++) {
        for (let px = 0; px < SIZE; px++) {
            // Premultiplied sums over the samples.
            let sumR = 0;
            let sumG = 0;
            let sumB = 0;
            let sumA = 0;
            for (let sy = 0; sy < SAMPLES; sy++) {
                for (let sx = 0; sx < SAMPLES; sx++) {
                    let r = 0;
                    let g = 0;
                    let b = 0;
                    let a = 0;
                    for (const [[cr, cg, cb], ca] of cometLayers(px + (sx + 0.5) / SAMPLES, py + (sy + 0.5) / SAMPLES, t)) {
                        r = cr * ca + r * (1 - ca);
                        g = cg * ca + g * (1 - ca);
                        b = cb * ca + b * (1 - ca);
                        a = ca + a * (1 - ca);
                    }
                    sumR += r;
                    sumG += g;
                    sumB += b;
                    sumA += a;
                }
            }
            const o = (py * SIZE + px) * 4;
            if (sumA > 0) {
                pixels[o] = Math.round(255 * clamp(sumR / sumA));
                pixels[o + 1] = Math.round(255 * clamp(sumG / sumA));
                pixels[o + 2] = Math.round(255 * clamp(sumB / sumA));
            }
            pixels[o + 3] = Math.round(255 * sumA / (SAMPLES * SAMPLES));
        }
    }
    return pixels;
}

function chunk(type, data) {
    const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(typeAndData) >>> 0);
    return Buffer.concat([length, typeAndData, crc]);
}

// Each row behind PNG's filter byte 0 (none), deflated.
function compressRows(pixels) {
    const stride = SIZE * 4;
    const raw = Buffer.alloc((stride + 1) * SIZE);
    for (let y = 0; y < SIZE; y++) pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
    return zlib.deflateSync(raw, { level: 9 });
}

// The first frame is the PNG's own image (IDAT), so a reader without APNG
// shows the comet still; each later one is an fdAT.
function encodeApng(frames) {
    const header = Buffer.alloc(13);
    header.writeUInt32BE(SIZE, 0);
    header.writeUInt32BE(SIZE, 4);
    header[8] = 8;
    header[9] = TRUECOLOR_WITH_ALPHA;
    const animation = Buffer.alloc(8);
    animation.writeUInt32BE(frames.length, 0);
    // No play count: endless.
    animation.writeUInt32BE(0, 4);
    const parts = [PNG_SIGNATURE, chunk("IHDR", header), chunk("acTL", animation)];
    let sequence = 0;
    frames.forEach((pixels, index) => {
        const control = Buffer.alloc(26);
        control.writeUInt32BE(sequence++, 0);
        control.writeUInt32BE(SIZE, 4);
        control.writeUInt32BE(SIZE, 8);
        control.writeUInt16BE(1, 20);
        control.writeUInt16BE(LOADER_IMAGE.framesPerSecond, 22);
        // dispose_op 1 (cleared to transparent after the frame), blend_op 0
        // (replaces): no frame shows through the next one.
        control[24] = 1;
        control[25] = 0;
        parts.push(chunk("fcTL", control));
        const data = compressRows(pixels);
        if (index === 0) {
            parts.push(chunk("IDAT", data));
        } else {
            const sequenceNumber = Buffer.alloc(4);
            sequenceNumber.writeUInt32BE(sequence++);
            parts.push(chunk("fdAT", Buffer.concat([sequenceNumber, data])));
        }
    });
    parts.push(chunk("IEND", Buffer.alloc(0)));
    return Buffer.concat(parts);
}

const started = Date.now();
const frames = [];
for (let i = 0; i < LOADER_IMAGE.frameCount; i++) frames.push(paintFrame(i / LOADER_IMAGE.frameCount));
const apng = encodeApng(frames);
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, apng);
console.log(`${OUTPUT}: ${frames.length} frames, ${Math.round(apng.length / 1024)} KB, painted in ${Date.now() - started} ms.`);
