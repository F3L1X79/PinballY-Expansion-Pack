// ============================================================
// A wheel dialog submitted while the Achievement List gets ready, through
// main.js on the fake PinballY globals with slow draws: it waits, as it
// waits while the list is open, and shows once the list is closed.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { settle } from "../support/fake_pinbally_host.js";
import { readLoader } from "../support/loader_reader.js";
import { getWheelDialogs, DIALOG_PRIORITY } from "../../common/core/wheel_dialog.js";
import { startPack, startOpeningFromMainMenu } from "./achievement_list_opening_scenario.js";
import { untilListShown, press } from "./achievement_list_reader.js";

test("a wheel dialog waits while the Achievement List gets ready", async () => {
    const { fake, lang } = await startPack({ drawMs: 60 });
    startOpeningFromMainMenu(fake, lang);
    fake.advanceTime(200);
    assert.equal(readLoader(fake).shown, true, "getting ready");

    let isShown = false;
    getWheelDialogs().submit({ priority: DIALOG_PRIORITY.RATING_PROMPT, open: close => { isShown = true; close(); } });
    await settle();
    fake.advanceTime(50);
    await settle();
    assert.equal(isShown, false, "the dialog waits while the list gets ready");

    untilListShown(fake);
    await settle();
    assert.equal(isShown, false, "then while it is open");

    press(fake, "Exit");
    await settle();
    fake.advanceTime(50);
    await settle();
    assert.equal(isShown, true, "shown once the list is closed");
    assertNoErrorLogged(fake);
});
