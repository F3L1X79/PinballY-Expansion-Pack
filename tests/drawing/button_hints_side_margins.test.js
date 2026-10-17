// ============================================================
// The Button Hints in a footer too narrow for them (a portrait panel):
// shrunk so they keep a margin on both sides of the band, never squeezed
// against its edges. Draws the footer alone with a host whose texts
// measure in proportion to their size; runs no screen.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { drawButtonHintsBand } from "../../common/drawing/steamball_drawing.js";

// Texts as wide as 0.6 of their size per letter, like a real font.
const host = {
    createStyledText: options => {
        let text = "";
        const size = () => options.textStyle.size + 2 * (options.padding || 0);
        return {
            add: str => { text += str; },
            measure: () => ({ width: text.length * options.textStyle.size * 0.6 + 2 * (options.padding || 0), height: size() }),
            draw: (dc, rect) => dc.drawText(text, rect),
        };
    },
};

const GROUPS = [
    { keys: ["GAUCHE", "DROITE"], label: "PARCOURIR" },
    { keys: ["SELECT"], label: "CHOISIR" },
    { keys: ["EXIT"], label: "FERMER" },
];

test("hints too wide for the footer keep a margin on both sides", () => {
    const texts = [];
    const dc = { fillRect: () => {}, drawText: (_text, rect) => texts.push(rect) };
    const width = 960;
    drawButtonHintsBand(host, dc, GROUPS, { width, height: 167 });
    const left = Math.min(...texts.map(rect => rect.x));
    const right = Math.max(...texts.map(rect => rect.x + rect.width));
    assert.ok(left >= 30, `left margin ${left}`);
    assert.ok(width - right >= 30, `right margin ${width - right}`);
});
