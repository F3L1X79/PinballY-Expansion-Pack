// ============================================================
// The Achievement List opened right after startup, before its drawing
// ahead, through main.js on the fake PinballY globals with slow draws: the
// wheel dims at once under the veil, the Loader turns over it after
// 150 ms, then the list shows, the Loader and the veil gone.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readVeil } from "../support/opening_reader.js";
import { readLoader } from "../support/loader_reader.js";
import { ACHIEVEMENT_LIST_Z_INDEX } from "../../common/achievements/achievement_list.js";
import { startPack, startOpeningFromMainMenu, LIST_VEIL } from "./achievement_list_opening_scenario.js";
import { isListOpen, untilListShown, readRows } from "./achievement_list_reader.js";

test("opened before its drawing ahead, the list dims the wheel at once, shows the Loader after 150 ms, then shows", async () => {
    const { fake, lang } = await startPack({ drawMs: 60 });

    startOpeningFromMainMenu(fake, lang);
    assert.deepEqual(readVeil(fake), LIST_VEIL, "the wheel dimmed at once");
    assert.equal(isListOpen(fake), false, "nothing of the list shows yet");

    fake.advanceTime(140);
    assert.deepEqual(readLoader(fake), { shown: false }, "no Loader within 150 ms");
    fake.advanceTime(20);
    const loader = readLoader(fake);
    assert.equal(loader.shown, true, "the Loader after 150 ms");
    assert.equal(loader.zIndex, ACHIEVEMENT_LIST_Z_INDEX.backdrop - 1, "over the veil, under the list");

    untilListShown(fake);
    assert.deepEqual(readLoader(fake), { shown: false }, "the Loader gone");
    assert.deepEqual(readVeil(fake), { shown: false }, "the veil gone");
    assert.ok(readRows(fake, lang.achievementList).length > 0, "the list shows its rows");
    assertNoErrorLogged(fake);
});
