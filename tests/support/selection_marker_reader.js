// ============================================================
// Reads a drawn screen's Selection Marker on the fake PinballY host, given
// the screen's marker z-index: how many marker layers it has, the one shown,
// and which of a screen's layers it surrounds. Never loaded by PinballY.
// ============================================================

import assert from "node:assert/strict";

// The marker's layers, shown or not.
export const markerLayerCount = (fake, zIndex) => fake.drawingLayers().filter(layer => layer.zIndex === zIndex).length;

export function markerLayer(fake, zIndex) {
    const marked = fake.drawingLayers().filter(layer => layer.zIndex === zIndex && layer.alpha > 0);
    assert.equal(marked.length, 1, "the Selection Marker surrounds exactly one choice");
    return marked[0];
}

// The layer among layers the marker surrounds: both centred on the same
// point, give or take the marker's canvas rounded up to whole pixels (the
// screens' choices are far further apart). Undefined when it surrounds none.
export function layerUnderMarker(fake, zIndex, layers) {
    const marker = markerLayer(fake, zIndex).position();
    const same = (a, b) => Math.abs(a - b) < 0.001;
    return layers.find(layer => same(layer.position().x, marker.x) && same(layer.position().y, marker.y));
}
