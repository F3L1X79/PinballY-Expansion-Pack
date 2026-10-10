// ============================================================
// Drawn Menu images tests: every image the Drawn Menus use ships with the
// pack, as a PNG of the size they place it at, as painted by
// maintainer/drawn_menu/generate_drawn_menu.mjs. Reads the files only.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { DRAWN_MENU_IMAGES } from "../common/drawn_menu_images.js";

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

test("the panel, the glass and the selection outline ship with the pack, each a PNG of its size", () => {
    const images = [
        ...Object.values(DRAWN_MENU_IMAGES.panel), ...Object.values(DRAWN_MENU_IMAGES.glass), DRAWN_MENU_IMAGES.selection,
    ];
    assert.equal(images.length, 7, "a top, a middle and a bottom for the panel and the glass, and the outline");
    for (const { file, width, height } of images) {
        const path = `assets/images/drawn_menu/${file}`;
        const url = new URL(`../${path}`, import.meta.url);
        assert.ok(existsSync(url), `${path} exists`);
        const bytes = readFileSync(url);
        assert.ok(bytes.subarray(0, 8).equals(PNG_SIGNATURE), `${path} is a PNG`);
        assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], [width, height], `${path} is ${width} x ${height} px`);
    }
});
