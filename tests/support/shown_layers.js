// ============================================================
// Reads the drawing layers a drawn screen shows at a z-index on the fake
// PinballY host: the ones whose alpha is above 0. Shared by the screen
// readers and the tests. Never loaded by PinballY.
// ============================================================

export const shownLayers = (fake, zIndex) => fake.drawingLayers().filter(layer => layer.zIndex === zIndex && layer.alpha > 0);
