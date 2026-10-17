// ============================================================
// The Avatar Frame list opened once its drawing ahead is over, through
// main.js on the fake PinballY globals with slow draws: it shows at once,
// with no veil and no Loader, the Selection Marker on the worn frame.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readVeil } from "../support/opening_reader.js";
import { readLoader, loaderLayerCount } from "../support/loader_reader.js";
import { DRAWN_AHEAD_MS } from "../mastery/mastery_bar_scenario.js";
import { isFrameListOpen, highlightedRow } from "../stats/profile_stats_reader.js";
import { startPack, startOpeningFrameList, WORN_FRAME } from "./avatar_frame_list_opening_scenario.js";

test("once drawn ahead, the list opens at once, with no veil and no Loader", async () => {
    const { fake, lang } = await startPack();
    fake.advanceTime(DRAWN_AHEAD_MS);

    startOpeningFrameList(fake, lang, { drawMs: 20 });
    assert.equal(isFrameListOpen(fake), true, "open at once");
    assert.equal(highlightedRow(fake), WORN_FRAME);
    assert.deepEqual(readVeil(fake), { shown: false });
    fake.advanceTime(500);
    assert.deepEqual(readLoader(fake), { shown: false });
    assert.equal(loaderLayerCount(fake), 0);
    assertNoErrorLogged(fake);
});
