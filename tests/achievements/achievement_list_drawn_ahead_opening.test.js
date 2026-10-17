// ============================================================
// The Achievement List opened once its drawing ahead is over, through
// main.js on the fake PinballY globals with slow draws: it shows at once,
// with no veil and no Loader.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readVeil } from "../support/opening_reader.js";
import { readLoader, loaderLayerCount } from "../support/loader_reader.js";
import { startPack, startOpeningFromMainMenu } from "./achievement_list_opening_scenario.js";
import { isListOpen } from "./achievement_list_reader.js";

const DRAWING_AHEAD_OVER_MS = 10 * 60 * 1000;

test("once drawn ahead, the list opens at once, with no veil and no Loader", async () => {
    const { fake, lang } = await startPack({ drawMs: 20 });
    fake.advanceTime(DRAWING_AHEAD_OVER_MS);

    startOpeningFromMainMenu(fake, lang);
    assert.equal(isListOpen(fake), true, "open at once");
    assert.deepEqual(readVeil(fake), { shown: false });
    fake.advanceTime(500);
    assert.deepEqual(readLoader(fake), { shown: false });
    assert.equal(loaderLayerCount(fake), 0);
    assertNoErrorLogged(fake);
});
