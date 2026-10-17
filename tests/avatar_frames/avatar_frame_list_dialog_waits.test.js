// ============================================================
// A wheel dialog submitted while the Avatar Frame list gets ready, through
// main.js on the fake PinballY globals with slow draws: it waits, as it
// waits while the list is open, and shows once the list and the Profile
// Stats it goes back to are closed.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { settle } from "../support/fake_pinbally_host.js";
import { readLoader } from "../support/loader_reader.js";
import { getWheelDialogs, DIALOG_PRIORITY } from "../../common/core/wheel_dialog.js";
import { press, untilFrameListShown, untilProfileStatsFadedIn } from "../stats/profile_stats_reader.js";
import { startPack, startOpeningFrameList } from "./avatar_frame_list_opening_scenario.js";

test("a wheel dialog waits while the Avatar Frame list gets ready", async () => {
    const { fake, lang } = await startPack();
    startOpeningFrameList(fake, lang, { drawMs: 60 });
    fake.advanceTime(200);
    assert.equal(readLoader(fake).shown, true, "getting ready");

    let isShown = false;
    getWheelDialogs().submit({ priority: DIALOG_PRIORITY.RATING_PROMPT, open: close => { isShown = true; close(); } });
    await settle();
    fake.advanceTime(50);
    await settle();
    assert.equal(isShown, false, "the dialog waits while the list gets ready");

    untilFrameListShown(fake);
    await settle();
    assert.equal(isShown, false, "then while it is open");

    press(fake, "Exit");
    untilProfileStatsFadedIn(fake);
    press(fake, "Exit");
    await settle();
    fake.advanceTime(50);
    await settle();
    assert.equal(isShown, true, "shown once the list and the Profile Stats are closed");
    assertNoErrorLogged(fake);
});
