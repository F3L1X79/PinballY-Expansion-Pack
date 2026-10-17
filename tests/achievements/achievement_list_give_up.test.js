// ============================================================
// Giving up the Achievement List while it gets ready, through main.js on
// the fake PinballY globals with slow draws: Next, Prev and Select are
// swallowed; Exit gives up (no veil, no Loader, nothing of the list shown)
// and goes back where the list was opened from, the main menu or the
// Profile Stats; attract mode gives up without going back anywhere.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readVeil } from "../support/opening_reader.js";
import { readLoader } from "../support/loader_reader.js";
import { ACHIEVEMENT_LIST_Z_INDEX } from "../../common/achievements/achievement_list.js";
import { startPack, startOpeningFromMainMenu, LIST_VEIL } from "./achievement_list_opening_scenario.js";
import { isListOpen, press } from "./achievement_list_reader.js";
import {
    openProfileStats, choose, isProfileStatsOpen, untilProfileStatsFadedIn, PROFILE_STATS_OPEN_MS,
} from "../stats/profile_stats_reader.js";

const LIST_Z_INDEXES = Object.values(ACHIEVEMENT_LIST_Z_INDEX);

function assertNothingLeft(fake) {
    assert.deepEqual(readVeil(fake), { shown: false }, "no veil");
    assert.deepEqual(readLoader(fake), { shown: false }, "no Loader");
    assert.equal(fake.drawingLayers().filter(layer => LIST_Z_INDEXES.includes(layer.zIndex) && layer.alpha > 0).length, 0,
        "nothing of the list shows");
}

test("Exit while the list gets ready goes back where it was opened from; attract mode only gives up", async () => {
    const { fake, lang } = await startPack({ drawMs: 60 });

    startOpeningFromMainMenu(fake, lang);
    fake.advanceTime(200);
    assert.equal(readLoader(fake).shown, true, "getting ready");
    for (const button of ["Next", "Prev", "Select"]) {
        assert.ok(press(fake, button).defaultPrevented, `${button} never reaches the wheel`);
    }
    assert.equal(readLoader(fake).shown, true, "still getting ready");
    const commandsBeforeExit = fake.executedCommands().length;
    assert.ok(press(fake, "Exit").defaultPrevented);
    assertNothingLeft(fake);
    assert.deepEqual(fake.executedCommands().slice(commandsBeforeExit), [globalThis.command.ShowMainMenu], "the main menu reopens");
    fake.advanceTime(2000);
    assertNothingLeft(fake);
    assert.equal(isListOpen(fake), false);

    // From the Profile Stats, back to them.
    openProfileStats(fake, lang);
    choose(fake, lang.profileStats.buttons.achievements);
    assert.deepEqual(readVeil(fake), LIST_VEIL, "getting ready again");
    press(fake, "Exit");
    // The Profile Stats get ready in turn, under their own veil.
    untilProfileStatsFadedIn(fake);
    assertNothingLeft(fake);
    assert.equal(isProfileStatsOpen(fake), true, "back to the Profile Stats");

    press(fake, "Exit");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    startOpeningFromMainMenu(fake, lang);
    assert.equal(readVeil(fake).shown, true, "getting ready once more");
    const commandsBeforeAttract = fake.executedCommands().length;
    fake.fire("attractmodestart", {});
    assertNothingLeft(fake);
    fake.advanceTime(2000);
    assertNothingLeft(fake);
    assert.equal(isListOpen(fake), false);
    assert.deepEqual(fake.executedCommands().slice(commandsBeforeAttract), [], "attract mode goes back nowhere");
    assertNoErrorLogged(fake);
});
