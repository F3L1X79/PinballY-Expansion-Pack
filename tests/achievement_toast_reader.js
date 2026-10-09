// ============================================================
// Reads the Achievement Toasts drawn on the fake PinballY host: only the
// toasts' own draws, not the other drawn screens (the Achievement List,
// drawn ahead from startup, or the Challenge Card).
// Never loaded by PinballY.
// ============================================================

import { ACHIEVEMENT_TOAST_Z_INDEX } from "../common/achievement_toast.js";

// Every toast draw so far, in order: { zIndex, texts }.
export const toastDrawings = fake => fake.drawings().filter(drawing => drawing.zIndex === ACHIEVEMENT_TOAST_Z_INDEX);

// The height of each toast card on screen, oldest (highest) first: its
// border is the widest frame its layer draws.
export const shownCardHeights = fake => fake.drawingLayers()
    .filter(layer => layer.zIndex === ACHIEVEMENT_TOAST_Z_INDEX && layer.texts().length > 0)
    .sort((a, b) => b.position().y - a.position().y)
    .map(layer => layer.frames().reduce((widest, frame) => (frame.width > widest.width ? frame : widest)).height);
