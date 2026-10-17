// ============================================================
// Selection Marker tests: over the fake PinballY host, checks that the
// glow drawn round a choice, even one of fractional size, never draws two
// pieces over each other (a dark line across the glow on the cabinet) nor
// a piece with an alpha of 0 (fully opaque in PinballY), that it is drawn
// again as time goes by, and that remove() leaves no layer nor timer.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import { createSelectionMarker } from "../../common/drawing/selection_marker.js";

const Z_INDEX = 7000;
const REFERENCE = { referenceWidth: 3413.33, referenceHeight: 1920 };
const FRACTIONAL_CHOICE = { x: 100.3, y: 50.7, w: 333.37, h: 97.61 };

const fillsOf = layer => layer.strokes().filter(stroke => "fill" in stroke);

const overlap = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

function openMarker() {
    const fake = createFakePinballYHost();
    const marker = createSelectionMarker(fake, { zIndex: Z_INDEX, ...REFERENCE });
    marker.moveTo(FRACTIONAL_CHOICE);
    marker.setOpacity(1);
    const [layer] = fake.drawingLayers().filter(candidate => candidate.zIndex === Z_INDEX);
    return { fake, marker, layer };
}

test("no two pieces of the glow overlap, even round a choice of fractional size", () => {
    const { fake, layer } = openMarker();
    for (const elapsedMs of [0, 1234, 2717]) {
        fake.advanceTime(elapsedMs);
        const rects = fillsOf(layer).map(stroke => stroke.rect);
        assert.ok(rects.length > 0, "the glow is drawn");
        rects.forEach((rect, index) => {
            const other = rects.slice(index + 1).find(candidate => overlap(rect, candidate));
            assert.equal(other, undefined, `piece ${JSON.stringify(rect)} overlaps ${JSON.stringify(other)}`);
        });
    }
});

test("no piece of the glow is drawn with an alpha of 0", () => {
    const { layer } = openMarker();
    const transparent = fillsOf(layer).filter(stroke => stroke.fill >>> 24 === 0);
    assert.deepEqual(transparent, []);
});

test("the glow follows the opacity it is given", () => {
    const { marker, layer } = openMarker();
    marker.setOpacity(0.4);
    assert.equal(layer.alpha, 0.4);
});

test("the glow is drawn again as time goes by", () => {
    const { fake, layer } = openMarker();
    const before = fillsOf(layer);
    fake.advanceTime(500);
    assert.notDeepEqual(fillsOf(layer), before);
});

test("once removed, the marker leaves no layer and no timer", () => {
    const { fake, marker } = openMarker();
    marker.remove();
    assert.deepEqual(fake.drawingLayers().filter(layer => layer.zIndex === Z_INDEX), []);
    assert.equal(fake.runningIntervalCount(), 0);
});
