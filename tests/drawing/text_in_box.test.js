// ============================================================
// textInBox(): a label too long for its box (the Welcome Screen's "stay"
// row with a long table name, in a portrait panel) wraps and shrinks
// until it fits the box's height, then ends with "…". Draws with a host
// whose texts measure in proportion to their size; runs no screen.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { textInBox } from "../../common/drawing/steamball_drawing.js";

// Letters 0.6 of the size wide, lines 1.3 of it high, wrapped by words.
const host = {
    createStyledText: options => {
        let text = "";
        const size = options.textStyle.size;
        return {
            add: str => { text += str; },
            measure: width => {
                let lines = 1;
                let line = 0;
                for (const word of text.split(" ")) {
                    const w = (word.length + (line > 0 ? 1 : 0)) * size * 0.6;
                    if (line > 0 && line + w > width) {
                        lines++;
                        line = word.length * size * 0.6;
                    } else {
                        line += w;
                    }
                }
                return { width, height: lines * size * 1.3 };
            },
            draw: (dc, rect) => dc.drawText(text, size, rect),
        };
    },
};

function drawn(str, box) {
    const drawnTexts = [];
    textInBox(host, { drawText: (text, size, rect) => drawnTexts.push({ text, size, rect }) }, str, box);
    return drawnTexts[0];
}

const BOX = { x: 0, y: 12, width: 300, height: 96, size: 26, minSize: 18 };

test("a label that fits keeps its size, centred in the box", () => {
    const { text, size, rect } = drawn("Random table", BOX);
    assert.equal(text, "Random table");
    assert.equal(size, 26);
    assert.equal(rect.y + rect.height / 2, BOX.y + BOX.height / 2);
});

test("a long label shrinks until it fits the box's height", () => {
    const { text, size, rect } = drawn("Rester sur Whoa Nellie! Big Juicy Melons™", BOX);
    assert.equal(text, "Rester sur Whoa Nellie! Big Juicy Melons™");
    assert.ok(size < 26 && size >= 18, `size ${size}`);
    assert.ok(rect.y >= BOX.y && rect.y + rect.height <= BOX.y + BOX.height);
});

test("a label too long even at the smallest size ends with an ellipsis", () => {
    const { text, size, rect } = drawn("Rester sur ".repeat(20), BOX);
    assert.equal(size, 18);
    assert.ok(text.endsWith("…"));
    assert.ok(rect.y + rect.height <= BOX.y + BOX.height);
});
