// ============================================================
// The Young Players family seen by Profiles that are not children, through
// main.js on the fake PinballY globals: an adult's or Guest's Play on a
// Wednesday at 16:30 unlocks nothing, and their Achievement List never shows
// Snack Time or Wednesday Off, not even as missing.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startSurprisesScenario } from "./surprises_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";

test("an adult's or Guest's Wednesday Play at 16:30 unlocks nothing, and their list has no Young Players entry", async () => {
    // Monday 5 October 2026.
    const { fake, TEXT, waitUntil, play, listRows, switchTo } = await startSurprisesScenario({ now: new Date(2026, 9, 5, 9, 0, 0) });
    const secrets = [
        { title: TEXT.snackTimeTitle(), description: TEXT.snackTimeDescription(), hint: TEXT.snackTimeHint() },
        { title: TEXT.wednesdayOffTitle(), description: TEXT.wednesdayOffDescription(), hint: TEXT.wednesdayOffHint() },
    ];
    const showsYoungPlayers = rows => rows.some(row => secrets.some(({ title, description, hint }) => [title, hint].includes(row.title)
        || [description, hint].includes(row.description)));
    const unlocksYoungPlayers = titles => secrets.some(({ title }) => titles.includes(title));

    waitUntil(2026, 9, 7, 16, 30);
    assert.ok(!unlocksYoungPlayers(await play()), "Guest on Wednesday at 16:30");
    assert.ok(!showsYoungPlayers(listRows()), "Guest's list");

    await switchTo("Alice");
    waitUntil(2026, 9, 14, 16, 30);
    assert.ok(!unlocksYoungPlayers(await play()), "Alice on Wednesday at 16:30");
    assert.ok(!showsYoungPlayers(listRows()), "Alice's list");

    assertNoErrorLogged(fake);
});
