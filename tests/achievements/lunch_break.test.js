// ============================================================
// Lunch Break, a secret of the Surprises family, started through main.js
// on the fake PinballY globals: only a Play started from 12:00 to 13:59,
// Monday to Friday, unlocks it, for the Profile active at its start; 11:59,
// 14:00, a Saturday or a game under a minute do not. While missing, its
// row shows "???" and its hint.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startSurprisesScenario, showsMissing, showsUnlocked, SHORT_GAME_MS } from "./surprises_scenario.js";

test("only a weekday Play started from 12:00 to 13:59 unlocks Lunch Break", async () => {
    // Monday 5 October 2026.
    const { fake, TEXT, LIST_TEXT, waitUntil, play, listRows, switchTo } = await startSurprisesScenario({ now: new Date(2026, 9, 5, 9, 0, 0) });
    const secret = {
        title: TEXT.lunchBreakTitle(), description: TEXT.lunchBreakDescription("12:00", "13:59"), hint: TEXT.lunchBreakHint(),
    };
    assert.match(secret.description, /12:00/);
    assert.match(secret.description, /13:59/);

    assert.ok(showsMissing(listRows(), secret, LIST_TEXT.secretTitle));

    waitUntil(2026, 9, 5, 11, 59);
    assert.ok(!(await play()).includes(secret.title), "Monday at 11:59");
    waitUntil(2026, 9, 5, 12, 30);
    assert.ok(!(await play(SHORT_GAME_MS)).includes(secret.title), "a game under a minute at 12:30");
    waitUntil(2026, 9, 10, 12, 30);
    assert.ok(!(await play()).includes(secret.title), "a Saturday at 12:30");
    waitUntil(2026, 9, 12, 14, 0);
    assert.ok(!(await play()).includes(secret.title), "Monday at 14:00");
    waitUntil(2026, 9, 13, 13, 59);
    assert.ok((await play()).includes(secret.title), "Tuesday at 13:59");
    assert.ok(showsUnlocked(listRows(), secret));

    await switchTo("Alice");
    assert.ok(showsMissing(listRows(), secret, LIST_TEXT.secretTitle), "Alice has not found it yet");
    waitUntil(2026, 9, 16, 12, 0);
    assert.ok((await play()).includes(secret.title), "Alice, on a Friday at 12:00");

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
