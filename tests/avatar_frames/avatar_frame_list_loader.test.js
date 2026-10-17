// ============================================================
// The Avatar Frame list opened right after startup, before its drawing
// ahead, through main.js on the fake PinballY globals with slow draws: the
// wheel dims at once under the veil, the Loader turns over it after
// 150 ms, then the list fades in whole with every row and the Selection
// Marker on the worn frame, the Loader gone first, the veil once the fade
// in is over.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readVeil, shownLayers } from "../support/opening_reader.js";
import { readLoader } from "../support/loader_reader.js";
import { AVATAR_FRAME_LIST_Z_INDEX } from "../../common/avatar_frames/avatar_frame_list_painter.js";
import { isFrameListOpen, untilFrameListShown, frameRows, highlightedRow } from "../stats/profile_stats_reader.js";
import { startPack, startOpeningFrameList, FRAME_LIST_VEIL, WORN_FRAME } from "./avatar_frame_list_opening_scenario.js";

test("opened before its drawing ahead, the list dims the wheel at once, shows the Loader after 150 ms, then fades in", async () => {
    const { fake, lang } = await startPack();

    startOpeningFrameList(fake, lang, { drawMs: 60 });
    assert.deepEqual(readVeil(fake), FRAME_LIST_VEIL, "the wheel dimmed at once");
    assert.equal(isFrameListOpen(fake), false, "nothing of the list shows yet");

    fake.advanceTime(140);
    assert.deepEqual(readLoader(fake), { shown: false }, "no Loader within 150 ms");
    fake.advanceTime(20);
    const loader = readLoader(fake);
    assert.equal(loader.shown, true, "the Loader after 150 ms");
    assert.equal(loader.zIndex, AVATAR_FRAME_LIST_Z_INDEX.backdrop - 1, "over the veil, under the list");
    assert.deepEqual(loader.position, { x: 0, y: 0 }, "in the middle of the playfield screen");

    while (!isFrameListOpen(fake)) fake.advanceTime(16);
    assert.deepEqual(readLoader(fake), { shown: false }, "the Loader gone before the fade in");
    const backdrop = shownLayers(fake, AVATAR_FRAME_LIST_Z_INDEX.backdrop);
    assert.ok(backdrop.length === 1 && backdrop[0].alpha < 1, "the list fading in");
    assert.equal(readVeil(fake).shown, true, "the veil stays while it fades in");

    untilFrameListShown(fake);
    assert.equal(shownLayers(fake, AVATAR_FRAME_LIST_Z_INDEX.backdrop)[0].alpha, 1, "the list fully in");
    assert.deepEqual(readVeil(fake), { shown: false }, "the veil gone");
    assert.equal(frameRows(fake).length, 11, "every row drawn");
    assert.equal(highlightedRow(fake), WORN_FRAME, "the Selection Marker on the worn frame");
    assertNoErrorLogged(fake);
});
