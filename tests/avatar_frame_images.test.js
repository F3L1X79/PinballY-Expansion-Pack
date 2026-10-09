// ============================================================
// Avatar Frame images tests: the ten frames ship with the pack, each at
// 384 px, at 192 px and greyed at 192 px for a locked frame, as painted by
// tools/avatar_frames/generate_frames.mjs. Reads the files only.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const FRAME_COUNT = 10;
const VARIANTS = [{ suffix: "384", size: 384 }, { suffix: "192", size: 192 }, { suffix: "192_locked", size: 192 }];
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

test("each of the thirty Avatar Frame images ships with the pack, as a square PNG of its size", () => {
    for (let tier = 1; tier <= FRAME_COUNT; tier++) {
        for (const { suffix, size } of VARIANTS) {
            const path = `assets/images/avatar_frames/frame_${String(tier).padStart(2, "0")}_${suffix}.png`;
            const url = new URL(`../${path}`, import.meta.url);
            assert.ok(existsSync(url), `${path} exists`);
            const bytes = readFileSync(url);
            assert.ok(bytes.subarray(0, 8).equals(PNG_SIGNATURE), `${path} is a PNG`);
            assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], [size, size], `${path} is ${size} px square`);
        }
    }
});
