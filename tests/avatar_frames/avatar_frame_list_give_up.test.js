// ============================================================
// Giving up the Avatar Frame list while it gets ready, through main.js on
// the fake PinballY globals with slow draws: Next, Prev and Select are
// swallowed and choose nothing; Exit gives up (no veil, no Loader, nothing
// of the list shown) and goes back to the Profile Stats it was opened
// from; attract mode gives up without going back anywhere.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readVeil } from "../support/opening_reader.js";
import { readLoader } from "../support/loader_reader.js";
import { AVATAR_FRAME_LIST_Z_INDEX } from "../../common/avatar_frames/avatar_frame_list_painter.js";
import { profileFile } from "../mastery/mastery_bar_scenario.js";
import {
    press, isFrameListOpen, isProfileStatsOpen, untilProfileStatsFadedIn,
} from "../stats/profile_stats_reader.js";
import { startPack, startOpeningFrameList, FRAME_LIST_VEIL } from "./avatar_frame_list_opening_scenario.js";

const LIST_Z_INDEXES = Object.values(AVATAR_FRAME_LIST_Z_INDEX);
const wornTier = fake => JSON.parse(fake.readFile(profileFile("guest"))).avatarFrame;

function assertNothingLeft(fake) {
    assert.deepEqual(readVeil(fake), { shown: false }, "no veil");
    assert.deepEqual(readLoader(fake), { shown: false }, "no Loader");
    assert.equal(fake.drawingLayers().filter(layer => LIST_Z_INDEXES.includes(layer.zIndex) && layer.alpha > 0).length, 0,
        "nothing of the list shows");
}

test("Exit while the list gets ready goes back to the Profile Stats; attract mode only gives up", async () => {
    const { fake, lang } = await startPack();

    startOpeningFrameList(fake, lang, { drawMs: 60 });
    fake.advanceTime(200);
    assert.equal(readLoader(fake).shown, true, "getting ready");
    for (const button of ["Next", "Prev", "Select", "Launch"]) {
        assert.ok(press(fake, button).defaultPrevented, `${button} never reaches the wheel`);
    }
    assert.equal(readLoader(fake).shown, true, "still getting ready");
    assert.equal(wornTier(fake), 2, "nothing chosen");
    assert.ok(press(fake, "Exit").defaultPrevented);
    // The Profile Stats get ready in turn, under their own veil.
    untilProfileStatsFadedIn(fake);
    assertNothingLeft(fake);
    assert.equal(isProfileStatsOpen(fake), true, "back to the Profile Stats");

    press(fake, "Exit");
    startOpeningFrameList(fake, lang, { drawMs: 60 });
    fake.advanceTime(50);
    assert.deepEqual(readVeil(fake), FRAME_LIST_VEIL, "getting ready again");
    const commandsBeforeAttract = fake.executedCommands().length;
    fake.fire("attractmodestart", {});
    assertNothingLeft(fake);
    fake.advanceTime(2000);
    assertNothingLeft(fake);
    assert.equal(isFrameListOpen(fake), false);
    assert.equal(isProfileStatsOpen(fake), false, "attract mode goes back nowhere");
    assert.deepEqual(fake.executedCommands().slice(commandsBeforeAttract), []);
    assertNoErrorLogged(fake);
});
