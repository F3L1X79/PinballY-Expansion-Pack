// ============================================================
// The drawn screens' footer band, from their layouts: it spans the
// panel's whole width inside its border and reaches the panel's bottom,
// so its rule runs from end to end and the Button Hints keep as much room
// under them as above. Layouts only; runs no screen.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutFrameList } from "../../common/avatar_frames/avatar_frame_list_painter.js";
import { layoutHouseholdStats } from "../../common/stats/household_stats_painter.js";

const LANDSCAPE_WIDTH = 1920 * 16 / 9;

test("the footer band spans the panel from side to side, down to its bottom", () => {
    const layouts = { "Avatar Frame list": layoutFrameList(LANDSCAPE_WIDTH, 4), "Household Stats": layoutHouseholdStats(LANDSCAPE_WIDTH, 3, 6) };
    for (const [screen, { panel, buttonHints }] of Object.entries(layouts)) {
        assert.equal(buttonHints.x, panel.x + 1, `${screen}: from the panel's left border`);
        assert.equal(buttonHints.x + buttonHints.w, panel.x + panel.w - 1, `${screen}: to its right border`);
        assert.equal(buttonHints.y + buttonHints.h, panel.y + panel.h - 1, `${screen}: down to its bottom border`);
    }
});
