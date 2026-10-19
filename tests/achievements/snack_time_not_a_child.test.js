// ============================================================
// The Young Players family seen by Profiles that are not children, through
// main.js on the fake PinballY globals: an adult's or Guest's Play at 16:30
// unlocks nothing, and their Achievement List never shows Snack Time, not
// even as missing.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startSurprisesScenario } from "./surprises_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";

test("an adult's or Guest's Play at 16:30 unlocks nothing, and their list has no Young Players entry", async () => {
    // Monday 5 October 2026.
    const { fake, TEXT, waitUntil, play, listRows, switchTo } = await startSurprisesScenario({ now: new Date(2026, 9, 5, 9, 0, 0) });
    const showsSnackTime = rows => rows.some(row => [TEXT.snackTimeTitle(), TEXT.snackTimeHint()].includes(row.title)
        || [TEXT.snackTimeDescription(), TEXT.snackTimeHint()].includes(row.description));

    waitUntil(2026, 9, 5, 16, 30);
    assert.ok(!(await play()).includes(TEXT.snackTimeTitle()), "Guest at 16:30");
    assert.ok(!showsSnackTime(listRows()), "Guest's list");

    await switchTo("Alice");
    waitUntil(2026, 9, 6, 16, 30);
    assert.ok(!(await play()).includes(TEXT.snackTimeTitle()), "Alice at 16:30");
    assert.ok(!showsSnackTime(listRows()), "Alice's list");

    assertNoErrorLogged(fake);
});
