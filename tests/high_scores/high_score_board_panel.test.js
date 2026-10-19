// ============================================================
// High Score Board panel: the stretched middle slice stays opaque down to the
// bottom slice.
// - GDI+ fades a stretched image's last row: drawn short, the wheel showed through.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, MEDIEVAL, FACTORY } from "./high_scores_scenario.js";
import { openBoard, panelSlices } from "./high_score_board_reader.js";
import { DRAWN_MENU_IMAGES } from "../../common/drawn_menu/drawn_menu_images.js";

test("the panel's middle slice stays opaque down to the bottom slice", async () => {
    const { fake, setBoard, play } = await startHighScores();
    const { default: lang } = await import("../../common/core/i18n.js");
    setBoard(MEDIEVAL, FACTORY);
    await play(MEDIEVAL, { after: FACTORY });

    fake.setLayoutSize({ width: 2544, height: 1594 });
    openBoard(fake, lang);
    const { middle, bottom } = panelSlices(fake);
    const sourceRows = DRAWN_MENU_IMAGES.panel.middle.height;
    const opaqueBottom = middle.y + middle.height * (sourceRows - 1) / sourceRows;
    assert.ok(opaqueBottom >= bottom.y - 1e-6, `opaque down to ${opaqueBottom}, the bottom slice starts at ${bottom.y}`);
});
