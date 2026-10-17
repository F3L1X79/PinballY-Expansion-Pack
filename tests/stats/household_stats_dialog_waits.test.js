// ============================================================
// A wheel dialog submitted while the Household Stats get ready, through
// main.js on the fake PinballY globals: it waits, as it waits while they
// are open, and shows once they are given up.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { settle } from "../support/fake_pinbally_host.js";
import { readLoader } from "../support/loader_reader.js";
import { startOpeningHouseholdStats, press } from "./household_stats_reader.js";
import { getWheelDialogs, DIALOG_PRIORITY } from "../../common/core/wheel_dialog.js";

test("a wheel dialog waits while the Household Stats get ready", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {} }, active: "Alice" });
    fake.setDrawMs(60);
    startOpeningHouseholdStats(fake, lang);
    // The Profile Stats closed to open them: only they hold the dialogs.
    fake.advanceTime(200);
    assert.equal(readLoader(fake).shown, true, "getting ready");

    let isShown = false;
    getWheelDialogs().submit({ priority: DIALOG_PRIORITY.RATING_PROMPT, open: close => { isShown = true; close(); } });
    await settle();
    fake.advanceTime(50);
    await settle();
    assert.equal(isShown, false, "the dialog waits");

    // Exit goes back to the Profile Stats, which the dialog waits for in turn.
    press(fake, "Exit");
    press(fake, "Exit");
    await settle();
    fake.advanceTime(50);
    await settle();
    assert.equal(isShown, true, "shown once back on the wheel");
    assertNoErrorLogged(fake);
});
