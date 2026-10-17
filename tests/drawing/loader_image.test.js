// ============================================================
// Loader image tests: the comet ships with the pack as the APNG its shared
// description announces (square size, frame count, endless loop, colours
// with alpha), as painted by maintainer/loader/generate_loader.mjs. Reads
// the file only.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { LOADER_IMAGE } from "../../common/drawing/loader_image.js";

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
// IHDR's colour type for RGB with an alpha channel.
const TRUECOLOR_WITH_ALPHA = 6;

// The PNG's chunks as { type, data }, in file order.
function chunksOf(bytes) {
    const chunks = [];
    for (let offset = 8; offset < bytes.length;) {
        const length = bytes.readUInt32BE(offset);
        chunks.push({ type: bytes.toString("ascii", offset + 4, offset + 8), data: bytes.subarray(offset + 8, offset + 8 + length) });
        offset += 12 + length;
    }
    return chunks;
}

test("the comet ships with the pack as a looping APNG with alpha, as its description says", () => {
    const path = `${LOADER_IMAGE.folder.replace(/\\/g, "/")}/${LOADER_IMAGE.file}`;
    const url = new URL(`../../${path}`, import.meta.url);
    assert.ok(existsSync(url), `${path} exists`);
    const bytes = readFileSync(url);
    assert.ok(bytes.subarray(0, 8).equals(PNG_SIGNATURE), `${path} is a PNG`);

    const chunks = chunksOf(bytes);
    const header = chunks.find(chunk => chunk.type === "IHDR").data;
    assert.deepEqual([header.readUInt32BE(0), header.readUInt32BE(4)], [192, 192], "192 px square");
    assert.deepEqual([LOADER_IMAGE.width, LOADER_IMAGE.height], [192, 192]);
    assert.equal(header[9], TRUECOLOR_WITH_ALPHA, "RGB with alpha, for the tail's soft edges");

    const animation = chunks.find(chunk => chunk.type === "acTL");
    assert.ok(animation, "animated (acTL)");
    assert.equal(animation.data.readUInt32BE(0), 27, "27 frames: 0.9 s a lap at 30 fps");
    assert.equal(LOADER_IMAGE.frameCount, 27);
    assert.equal(animation.data.readUInt32BE(4), 0, "loops without end");
    const frameControls = chunks.filter(chunk => chunk.type === "fcTL");
    assert.equal(frameControls.length, 27);
    for (const { data } of frameControls) {
        assert.deepEqual([data.readUInt16BE(20), data.readUInt16BE(22)], [1, 30], "each frame lasts 1/30 s");
    }
});
