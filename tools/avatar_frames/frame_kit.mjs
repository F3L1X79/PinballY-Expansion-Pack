// ============================================================
// A tiny vector painter for the Avatar Frames, in plain Node.js:
// shapes are signed distance functions (negative inside), painted with
// anti-aliased edges, bevelled metal, gems, spheres, glows and noise on a
// premultiplied RGBA canvas, saved as PNG with transparency. Coordinates:
// the Avatar's image box is [-1, 1] on both axes, y pointing down; the
// canvas spans [-EXTENT, EXTENT]. Run by generate_frames.mjs, never by
// PinballY.
// ============================================================

import zlib from "node:zlib";
import fs from "node:fs";

export const EXTENT = 1.5;
export const TAU = Math.PI * 2;
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const mix = (a, b, t) => a + (b - a) * t;
export const smoothstep = (e0, e1, x) => {
    const t = clamp((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
};
export const rad = deg => deg * Math.PI / 180;

// Light from the top left, toward the viewer.
const LIGHT = (() => {
    const v = [-0.42, -0.62, 0.66];
    const l = Math.hypot(...v);
    return v.map(c => c / l);
})();
const [LX, LY, LZ] = LIGHT;

// ---------- Colours: [r, g, b] in 0..1 ----------

export function hex(h) {
    const n = parseInt(h.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
const col = c => (typeof c === "string" ? hex(c) : c);
export const mixc = (a, b, t) => {
    const [x, y] = [col(a), col(b)];
    return [mix(x[0], y[0], t), mix(x[1], y[1], t), mix(x[2], y[2], t)];
};
export const WHITE = [1, 1, 1];
export const BLACK = [0, 0, 0];

// A colour ramp from [[t, colour], ...], t from 0 to 1.
export function ramp(stops) {
    const s = stops.map(([t, c]) => [t, col(c)]);
    return t => {
        t = clamp(t);
        for (let i = 1; i < s.length; i++) {
            if (t <= s[i][0]) {
                const [t0, c0] = s[i - 1];
                const [t1, c1] = s[i];
                return mixc(c0, c1, (t - t0) / (t1 - t0 || 1));
            }
        }
        return s[s.length - 1][1];
    };
}

export const RAMPS = {
    gold: ramp([[0, "#2a1503"], [0.22, "#6e420c"], [0.45, "#b8801f"], [0.62, "#e9bb4c"], [0.78, "#ffe89a"], [0.9, "#fff8dc"], [1, "#ffffff"]]),
    brass: ramp([[0, "#221304"], [0.25, "#5e3c12"], [0.48, "#a2742c"], [0.66, "#d6ac5c"], [0.82, "#f6dc9c"], [1, "#fffbe8"]]),
    copper: ramp([[0, "#1f0a03"], [0.25, "#5f2410"], [0.48, "#a8532a"], [0.66, "#dd8a55"], [0.84, "#ffcca0"], [1, "#fff4ea"]]),
    silver: ramp([[0, "#12161d"], [0.25, "#3a4352"], [0.48, "#8691a3"], [0.66, "#c3ccd9"], [0.84, "#eef3fa"], [1, "#ffffff"]]),
    platinum: ramp([[0, "#1b1a2a"], [0.24, "#4b4c66"], [0.46, "#9a9db8"], [0.64, "#d3d6ea"], [0.82, "#f4f5ff"], [1, "#ffffff"]]),
};

// ---------- Noise ----------

function hash2(i, j) {
    let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
}
export const hash = (i, j = 0) => hash2(i | 0, j | 0);

export function noise(x, y) {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);
    return mix(mix(hash2(i, j), hash2(i + 1, j), u), mix(hash2(i, j + 1), hash2(i + 1, j + 1), u), v);
}

export function fbm(x, y, octaves = 4) {
    let sum = 0;
    let amp = 0.5;
    let f = 1;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
        sum += amp * noise(x * f + o * 17.3, y * f - o * 9.1);
        norm += amp;
        f *= 2;
        amp *= 0.5;
    }
    return sum / norm;
}

// A seeded random in 0..1, for scattering.
export function rng(seed) {
    let s = seed >>> 0;
    return () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

// ---------- Signed distances ----------

export const sdCircle = (x, y, cx, cy, r) => Math.hypot(x - cx, y - cy) - r;

export function sdBox(x, y, cx, cy, hx, hy, r = 0) {
    const qx = Math.abs(x - cx) - hx + r;
    const qy = Math.abs(y - cy) - hy + r;
    return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
}

// A box whose corners are cut at 45 degrees, `cut` from each corner.
export function sdChamferBox(x, y, h, cut) {
    const ax = Math.abs(x);
    const ay = Math.abs(y);
    return Math.max(Math.max(ax, ay) - h, (ax + ay - (2 * h - cut)) / Math.SQRT2);
}

export function sdSegment(x, y, ax, ay, bx, by) {
    const pax = x - ax;
    const pay = y - ay;
    const bax = bx - ax;
    const bay = by - ay;
    const h = clamp((pax * bax + pay * bay) / (bax * bax + bay * bay));
    return Math.hypot(pax - bax * h, pay - bay * h);
}

// Exact distance to a polygon given as [[x, y], ...].
export function sdPolygon(x, y, pts) {
    const n = pts.length;
    let d = (x - pts[0][0]) ** 2 + (y - pts[0][1]) ** 2;
    let s = 1;
    for (let i = 0, j = n - 1; i < n; j = i, i++) {
        const [xi, yi] = pts[i];
        const [xj, yj] = pts[j];
        const ex = xj - xi;
        const ey = yj - yi;
        const wx = x - xi;
        const wy = y - yi;
        const ee = ex * ex + ey * ey;
        // Two equal points in a row make an edge of zero length.
        const t = ee > 0 ? clamp((wx * ex + wy * ey) / ee) : 0;
        const bx = wx - ex * t;
        const by = wy - ey * t;
        d = Math.min(d, bx * bx + by * by);
        const c1 = y >= yi;
        const c2 = y < yj;
        const c3 = ex * wy > ey * wx;
        if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
    }
    return s * Math.sqrt(d);
}

export const bboxOf = (pts, pad = 0.02) => {
    const xs = pts.map(p => p[0]);
    const ys = pts.map(p => p[1]);
    return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad];
};

// The point (x, y) seen from a frame at (cx, cy) turned by angle: a shape
// drawn along +u in that frame comes out turned by angle.
export function toLocal(x, y, cx, cy, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const dx = x - cx;
    const dy = y - cy;
    return [dx * c + dy * s, -dx * s + dy * c];
}

export function fromLocal(u, v, cx, cy, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [cx + u * c - v * s, cy + u * s + v * c];
}

// A polygon drawn in a local frame, placed at (cx, cy) turned by angle.
export const placed = (pts, cx, cy, angle = 0) => pts.map(([u, v]) => fromLocal(u, v, cx, cy, angle));

// A star of n points, outer radius r1, inner r2, first point at angle.
export function starPoints(cx, cy, r1, r2, n, angle = -Math.PI / 2) {
    const pts = [];
    for (let i = 0; i < 2 * n; i++) {
        const a = angle + (i * Math.PI) / n;
        const r = i % 2 === 0 ? r1 : r2;
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return pts;
}

// A leaf or feather outline along +u, from 0 to length, widest at `peak`.
export function leafPoints(length, width, { peak = 0.45, steps = 18, tipRound = 0 } = {}) {
    const top = [];
    const bottom = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const shape = t < peak ? Math.sin((t / peak) * Math.PI / 2) : Math.cos(((t - peak) / (1 - peak)) * Math.PI / 2);
        const w = (width / 2) * Math.max(tipRound, shape ** 0.85);
        top.push([t * length, -w]);
        bottom.push([t * length, w]);
    }
    return [...top, ...bottom.reverse()];
}

// A cubic Bezier sampled into points.
export function bezier(p0, p1, p2, p3, steps = 24) {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = (1 - t) ** 3;
        const b = 3 * (1 - t) ** 2 * t;
        const c = 3 * (1 - t) * t * t;
        const d = t ** 3;
        pts.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]);
    }
    return pts;
}

// A stroke along a polyline, its half-width going from w0 to w1; also
// gives the position along it (0 to 1) of the nearest point.
export function stroke(pts, w0, w1 = w0) {
    const segs = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1];
        const [bx, by] = pts[i];
        const l = Math.hypot(bx - ax, by - ay);
        segs.push({ ax, ay, bx, by, l, start: total });
        total += l;
    }
    const nearest = (x, y) => {
        let best = Infinity;
        let at = 0;
        let dist = 0;
        for (const s of segs) {
            const pax = x - s.ax;
            const pay = y - s.ay;
            const bax = s.bx - s.ax;
            const bay = s.by - s.ay;
            const h = clamp((pax * bax + pay * bay) / (s.l * s.l || 1));
            const d = Math.hypot(pax - bax * h, pay - bay * h);
            const along = (s.start + h * s.l) / total;
            const dd = d - mix(w0, w1, along);
            if (dd < best) {
                best = dd;
                at = along;
                dist = d;
            }
        }
        return { d: best, at, dist };
    };
    return {
        sdf: (x, y) => nearest(x, y).d,
        at: (x, y) => nearest(x, y).at,
        nearest,
        bbox: bboxOf(pts, Math.max(w0, w1) + 0.02),
    };
}

// A point on the square of half-size h, s from 0 to 1 clockwise from the
// top-left corner, with its outward normal.
export function onSquare(s, h) {
    const t = ((s % 1) + 1) % 1 * 4;
    const side = Math.floor(t);
    const f = t - side;
    if (side === 0) return { x: -h + 2 * h * f, y: -h, nx: 0, ny: -1 };
    if (side === 1) return { x: h, y: -h + 2 * h * f, nx: 1, ny: 0 };
    if (side === 2) return { x: h - 2 * h * f, y: h, nx: 0, ny: 1 };
    return { x: -h, y: h - 2 * h * f, nx: -1, ny: 0 };
}

// ---------- Painting ----------

const PIXEL_EPSILON = 0.6;

export function gradient(sdf, x, y, e) {
    const gx = sdf(x + e, y) - sdf(x - e, y);
    const gy = sdf(x, y + e) - sdf(x, y - e);
    const l = Math.hypot(gx, gy) || 1;
    return [gx / l, gy / l];
}

export class Canvas {
    constructor(size) {
        this.size = size;
        this.px = (2 * EXTENT) / size;
        this.buf = new Float32Array(size * size * 4);
    }

    // Calls fn(x, y, k) on every pixel centre in the box, k its index.
    each(bbox, fn) {
        const [x0, y0, x1, y1] = bbox || [-EXTENT, -EXTENT, EXTENT, EXTENT];
        const toPx = v => (v + EXTENT) / this.px;
        const i0 = Math.max(0, Math.floor(toPx(x0)) - 1);
        const i1 = Math.min(this.size - 1, Math.ceil(toPx(x1)) + 1);
        const j0 = Math.max(0, Math.floor(toPx(y0)) - 1);
        const j1 = Math.min(this.size - 1, Math.ceil(toPx(y1)) + 1);
        for (let j = j0; j <= j1; j++) {
            const y = -EXTENT + (j + 0.5) * this.px;
            for (let i = i0; i <= i1; i++) {
                fn(-EXTENT + (i + 0.5) * this.px, y, (j * this.size + i) * 4);
            }
        }
    }

    put(k, c, a, mode) {
        const b = this.buf;
        if (mode === "add") {
            b[k] += c[0] * a;
            b[k + 1] += c[1] * a;
            b[k + 2] += c[2] * a;
            b[k + 3] += a * (1 - b[k + 3]);
        } else if (mode === "erase") {
            const keep = 1 - a;
            b[k] *= keep;
            b[k + 1] *= keep;
            b[k + 2] *= keep;
            b[k + 3] *= keep;
        } else {
            const keep = 1 - a;
            b[k] = c[0] * a + b[k] * keep;
            b[k + 1] = c[1] * a + b[k + 1] * keep;
            b[k + 2] = c[2] * a + b[k + 2] * keep;
            b[k + 3] = a + b[k + 3] * keep;
        }
    }

    // A shape: paint(x, y, d) gives [r, g, b] or [r, g, b, a].
    shape(sdf, paint, { bbox, mode = "over", opacity = 1 } = {}) {
        const paintOf = typeof paint === "function" ? paint : () => col(paint);
        this.each(bbox, (x, y, k) => {
            const d = sdf(x, y);
            const cover = clamp(0.5 - d / this.px);
            if (cover <= 0) return;
            const c = paintOf(x, y, d);
            const a = (c.length > 3 ? c[3] : 1) * cover * opacity;
            if (a > 0) this.put(k, c, a, mode);
        });
    }

    // A soft glow around a shape, fading out over radius.
    glow(sdf, color, radius, strength, { bbox, mode = "add", inside = 0, power = 2 } = {}) {
        const c = col(color);
        this.each(bbox, (x, y, k) => {
            const d = sdf(x, y);
            if (d >= radius) return;
            const a = d <= 0 ? strength * inside : strength * (1 - d / radius) ** power;
            if (a > 0) this.put(k, c, a, mode);
        });
    }

    // A soft drop shadow under a shape.
    shadow(sdf, { dx = 0.012, dy = 0.022, blur = 0.05, opacity = 0.55, bbox } = {}) {
        const shifted = (x, y) => sdf(x - dx, y - dy);
        const box = bbox && [bbox[0] + dx - blur, bbox[1] + dy - blur, bbox[2] + dx + blur, bbox[3] + dy + blur];
        this.each(box, (x, y, k) => {
            const d = shifted(x, y);
            if (d >= blur) return;
            const a = opacity * (d <= 0 ? 1 : (1 - d / blur) ** 2);
            this.put(k, BLACK, a, "over");
        });
    }

    // Any per-pixel field: fn(x, y) gives [r, g, b, a] or null.
    field(fn, { bbox, mode = "over" } = {}) {
        this.each(bbox, (x, y, k) => {
            const c = fn(x, y);
            if (c && c[3] > 0) this.put(k, c, Math.min(1, c[3]), mode);
        });
    }

    // Half the size, each pixel the average of four.
    half() {
        const out = new Canvas(this.size / 2);
        const s = this.size;
        for (let j = 0; j < out.size; j++) {
            for (let i = 0; i < out.size; i++) {
                const o = (j * out.size + i) * 4;
                for (let c = 0; c < 4; c++) {
                    const a = ((2 * j) * s + 2 * i) * 4 + c;
                    out.buf[o + c] = (this.buf[a] + this.buf[a + 4] + this.buf[a + s * 4] + this.buf[a + s * 4 + 4]) / 4;
                }
            }
        }
        return out;
    }

    // Straight-alpha RGBA bytes.
    toRGBA() {
        const n = this.size * this.size;
        const out = Buffer.alloc(n * 4);
        for (let p = 0; p < n; p++) {
            const a = clamp(this.buf[p * 4 + 3]);
            for (let c = 0; c < 3; c++) out[p * 4 + c] = Math.round(clamp(a > 0 ? this.buf[p * 4 + c] / a : 0) * 255);
            out[p * 4 + 3] = Math.round(a * 255);
        }
        return out;
    }

    save(file) {
        writePNG(file, this.size, this.size, this.toRGBA());
    }
}

// ---------- Paints ----------

export const flat = (color, alpha = 1) => {
    const c = col(color);
    return () => [c[0], c[1], c[2], alpha];
};

// Bevelled, lit material: colorRamp picked by lighting; texture(x, y)
// shifts the pick (grain, engravings), alpha its opacity.
export function metal(sdf, colorRamp, {
    bevel = 0.04, base = 0.55, contrast = 1.3, env = 0.12, tilt = 0.1, spec = 0.5, shininess = 16, texture = null, alpha = 1,
} = {}) {
    return (x, y, d) => {
        const t = clamp(-d / bevel);
        let nx = 0;
        let ny = 0;
        let nz = 1;
        if (t < 1) {
            const [gx, gy] = gradient(sdf, x, y, 0.004);
            const s = Math.cos((t * Math.PI) / 2) * 1.8;
            nx = gx * s;
            ny = gy * s;
            const l = Math.hypot(nx, ny, 1);
            nx /= l;
            ny /= l;
            nz = 1 / l;
        }
        const diffuse = nx * LX + ny * LY + nz * LZ - LZ;
        let v = base + diffuse * contrast + env * Math.sin(x * 2.1 - y * 3.3 + 0.8) - y * tilt;
        if (texture) v += texture(x, y);
        const c = colorRamp(v);
        const rx = 2 * nz * nx;
        const ry = 2 * nz * ny;
        const rz = 2 * nz * nz - 1;
        const sp = spec * Math.max(0, rx * LX + ry * LY + rz * LZ) ** shininess;
        return [c[0] + sp, c[1] + sp, c[2] + sp, alpha];
    };
}

// A cut gem centred on (cx, cy), radius r: a flat table, facets lit from
// the top left, a darker rim and a white glint.
export function gem(cx, cy, r, color, { facets = 8, sdf = null, glint = 1, angle = 0 } = {}) {
    const base = col(color);
    const dark = mixc(base, BLACK, 0.7);
    const light = mixc(base, WHITE, 0.55);
    const lightAngle = Math.atan2(LY, LX);
    return (x, y, d) => {
        const u = (x - cx) / r;
        const v = (y - cy) / r;
        const rr = Math.hypot(u, v);
        let b;
        if (rr < 0.42) {
            b = 0.66 - v * 0.3 + u * 0.1;
        } else {
            const a = Math.atan2(v, u) - angle;
            const sector = Math.floor((a + Math.PI) / (TAU / facets));
            const mid = (sector + 0.5) * (TAU / facets) - Math.PI + angle;
            b = 0.5 + 0.36 * Math.cos(mid - lightAngle) + (sector % 2 ? -0.08 : 0.06);
            b *= mix(1.05, 0.78, clamp((rr - 0.42) / 0.58));
        }
        const rim = sdf ? smoothstep(0, -r * 0.18, d) : 1;
        b *= mix(0.55, 1, rim);
        let c = b < 0.5 ? mixc(dark, base, b * 2) : mixc(base, light, (b - 0.5) * 2);
        const hl = glint * (Math.exp(-((u + 0.3) ** 2 + (v + 0.36) ** 2) / 0.02) + 0.5 * Math.exp(-((u - 0.28) ** 2 + (v - 0.3) ** 2) / 0.008));
        c = [c[0] + hl, c[1] + hl, c[2] + hl];
        return c;
    };
}

// A lit sphere centred on (cx, cy), radius r, coloured from colorRamp by
// lighting; chrome adds a horizon reflection.
export function sphere(cx, cy, r, colorRamp, { spec = 0.9, shininess = 30, chrome = false } = {}) {
    return (x, y) => {
        const u = (x - cx) / r;
        const v = (y - cy) / r;
        const w = Math.sqrt(Math.max(0, 1 - u * u - v * v));
        const diffuse = u * LX + v * LY + w * LZ;
        let t = 0.15 + 0.75 * Math.max(0, diffuse);
        if (chrome) {
            // Sky above the horizon, dark ground below, a bright rim.
            const horizon = v + 0.15 * u;
            t = horizon < -0.05 ? 0.78 - horizon * 0.25 : 0.22 + 0.25 * smoothstep(0.3, 1, Math.hypot(u, v));
        }
        const c = colorRamp(t);
        const rx = 2 * w * u;
        const ry = 2 * w * v;
        const rz = 2 * w * w - 1;
        const sp = spec * Math.max(0, rx * LX + ry * LY + rz * LZ) ** shininess;
        return [c[0] + sp, c[1] + sp, c[2] + sp];
    };
}

// A four-pointed twinkle with its glow, size its half-length.
export function sparkle(cv, x, y, size, color = WHITE, strength = 1) {
    const pts = starPoints(x, y, size, size * 0.16, 4, -Math.PI / 2);
    const sdf = (px, py) => sdPolygon(px, py, pts);
    const box = [x - size * 1.6, y - size * 1.6, x + size * 1.6, y + size * 1.6];
    cv.glow((px, py) => Math.hypot(px - x, py - y), color, size * 1.1, 0.5 * strength, { bbox: box, inside: 1 });
    cv.shape(sdf, (px, py) => {
        const c = mixc(color, WHITE, clamp(1 - Math.hypot(px - x, py - y) / size));
        return [c[0], c[1], c[2], strength];
    }, { bbox: box, mode: "add" });
}

// ---------- PNG ----------

const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c >>> 0;
    }
    return table;
})();

function crc32(buf) {
    let c = 0xffffffff;
    for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, crc]);
}

export function writePNG(file, width, height, rgba) {
    const raw = Buffer.alloc((width * 4 + 1) * height);
    for (let j = 0; j < height; j++) {
        raw[j * (width * 4 + 1)] = 0;
        rgba.copy(raw, j * (width * 4 + 1) + 1, j * width * 4, (j + 1) * width * 4);
    }
    const header = Buffer.alloc(13);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);
    header[8] = 8;
    header[9] = 6;
    fs.writeFileSync(file, Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        chunk("IHDR", header),
        chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
        chunk("IEND", Buffer.alloc(0)),
    ]));
}
