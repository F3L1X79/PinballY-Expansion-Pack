// ============================================================
// Maintainer's tool, never loaded by PinballY. Paints the ten Avatar
// Frames of designs.mjs at 768 px, then writes, in assets/images/
// avatar_frames/, each frame at 384 and 192 px (frame_NN_384.png,
// frame_NN_192.png) and a greyed 192 px copy for locked frames
// (frame_NN_192_locked.png). The Avatar's box is the middle two thirds.
// Run: node tools/avatar_frames/generate_frames.mjs [numbers], numbers
// such as 3,7 to paint only those frames.
// ============================================================

import path from "node:path";
import { fileURLToPath } from "node:url";
import { Canvas, writePNG } from "./frame_kit.mjs";
import { FRAMES } from "./designs.mjs";

const OUTPUT = fileURLToPath(new URL("../../assets/images/avatar_frames/", import.meta.url));
const MASTER = 768;
const only = process.argv[2] ? process.argv[2].split(",").map(Number) : null;
if (only && only.some(number => !Number.isInteger(number) || number < 1 || number > FRAMES.length)) {
    console.error(`Frame numbers go from 1 to ${FRAMES.length}, comma-separated: ${process.argv[2]}`);
    process.exit(1);
}
const label = index => String(index + 1).padStart(2, "0");

// Grey, darker and a little see-through, from straight-alpha RGBA bytes.
function locked(rgba) {
    const out = Buffer.from(rgba);
    for (let p = 0; p < out.length; p += 4) {
        const luma = 0.3 * out[p] + 0.59 * out[p + 1] + 0.11 * out[p + 2];
        const grey = Math.round(luma * 0.5 + 18);
        out[p] = grey;
        out[p + 1] = grey;
        out[p + 2] = Math.round(grey * 1.08);
        out[p + 3] = Math.round(out[p + 3] * 0.85);
    }
    return out;
}

FRAMES.forEach((frame, index) => {
    if (only && !only.includes(index + 1)) return;
    const started = Date.now();
    const cv = new Canvas(MASTER);
    frame.draw(cv);
    const big = cv.half();
    const small = big.half();
    big.save(path.join(OUTPUT, `frame_${label(index)}_384.png`));
    small.save(path.join(OUTPUT, `frame_${label(index)}_192.png`));
    writePNG(path.join(OUTPUT, `frame_${label(index)}_192_locked.png`), small.size, small.size, locked(small.toRGBA()));
    console.log(`${label(index)} ${frame.name}: ${Date.now() - started} ms`);
});
