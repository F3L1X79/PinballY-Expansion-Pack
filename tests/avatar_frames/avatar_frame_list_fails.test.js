// ============================================================
// The Avatar Frame list failing to open from the Profile Stats, through
// main.js on the fake PinballY globals: the failure is logged, and no
// layer of the list nor of the Profile Stats set aside under it is left.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLines } from "../support/error_log.js";
import { whileDrawsFail, FAILING_DRAW_MESSAGE } from "../support/failing_draws.js";
import { readVeil } from "../support/opening_reader.js";
import { AVATAR_FRAME_LIST_Z_INDEX } from "../../common/avatar_frames/avatar_frame_list_painter.js";
import { openProfileStats, choose, profileStatsLayerCount, isFrameListOpen } from "../stats/profile_stats_reader.js";
import { startPack } from "./avatar_frame_list_opening_scenario.js";

const LIST_Z_INDEXES = Object.values(AVATAR_FRAME_LIST_Z_INDEX);

test("the Avatar Frame list failing to open leaves no layer of the Profile Stats set aside", async () => {
    const { fake, lang } = await startPack();
    // Right after startup: nothing of the list is drawn ahead yet.
    openProfileStats(fake, lang);
    whileDrawsFail(() => {
        choose(fake, lang.profileStats.buttons.frame);
        fake.advanceTime(1000);
    });
    // The first error: the drawing ahead's own steps fail too while draws fail.
    const [failure] = errorLines(fake);
    assert.ok(failure.startsWith("[DrawingAhead] ERROR in a foreground step") && failure.includes(FAILING_DRAW_MESSAGE), "the failure is logged");
    assert.equal(isFrameListOpen(fake), false);
    assert.equal(fake.drawingLayers().filter(layer => LIST_Z_INDEXES.includes(layer.zIndex) && layer.alpha > 0).length, 0);
    assert.equal(profileStatsLayerCount(fake), 0, "no layer of the Profile Stats, hidden or not");
    assert.deepEqual(readVeil(fake), { shown: false });
});
