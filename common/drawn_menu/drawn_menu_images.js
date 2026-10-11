// ============================================================
// Drawn Menu images: the PNG files of the Drawn Menu look, painted ahead
// by maintainer/drawn_menu/generate_drawn_menu.mjs into assets/images/
// drawn_menu/, with their size in pixels at the 1920 px reference height,
// at which they are shown 1:1. The panel and the glass are each cut into
// a top, a middle stretched to the menu's length and a bottom; the
// selection's outline is one entry high, in a margin that holds its glow.
// The ends are short enough for a menu of a single entry (250 px).
// No side effect.
// ============================================================

export const DRAWN_MENU_IMAGES_FOLDER = "assets\\images\\drawn_menu";

export const DRAWN_MENU_PANEL_WIDTH = 820;
// From the panel's edge to the face's thin gold frame.
export const DRAWN_MENU_FACE_INSET = 23;
// From the face's gold frame to the entries, on each side.
export const DRAWN_MENU_LIST_INSET = 41;
export const DRAWN_MENU_ENTRY_HEIGHT = 62;
// Around the selection's outline, for its glow.
export const DRAWN_MENU_SELECTION_MARGIN = 20;

export const DRAWN_MENU_LIST_WIDTH = DRAWN_MENU_PANEL_WIDTH - 2 * (DRAWN_MENU_FACE_INSET + DRAWN_MENU_LIST_INSET);
const slice = (file, height) => Object.freeze({ file, width: DRAWN_MENU_PANEL_WIDTH, height });

export const DRAWN_MENU_IMAGES = Object.freeze({
    panel: Object.freeze({
        top: slice("panel_top.png", 160),
        middle: slice("panel_middle.png", 8),
        bottom: slice("panel_bottom.png", 72),
    }),
    glass: Object.freeze({
        top: slice("glass_top.png", 160),
        middle: slice("glass_middle.png", 8),
        bottom: slice("glass_bottom.png", 90),
    }),
    selection: Object.freeze({
        file: "selection.png",
        width: DRAWN_MENU_LIST_WIDTH + 2 * DRAWN_MENU_SELECTION_MARGIN,
        height: DRAWN_MENU_ENTRY_HEIGHT + 2 * DRAWN_MENU_SELECTION_MARGIN,
    }),
});
