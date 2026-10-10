// ============================================================
// Full Moon Night, a secret of the Surprises family, started through
// main.js on the fake PinballY globals: only a Play started from 22:00 to
// 05:59 on a night when the moon is at least 99% lit unlocks it, the moon
// being computed on the cabinet. 21:59 or 06:00 that night, a new-moon
// night, a full-moon afternoon or a game under a minute do not. While
// missing, its row shows "???" and its hint; a Child Profile never sees it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startSurprisesScenario, showsMissing, showsUnlocked, SHORT_GAME_MS } from "./surprises_scenario.js";

test("only a Play started from 22:00 to 05:59 under a full moon unlocks Full Moon Night, never for a Child Profile", async () => {
    // Sunday 25 October 2026; the moon is full on the night of 25 to 26 October.
    const { fake, store, TEXT, LIST_TEXT, waitUntil, play, listRows, switchTo } = await startSurprisesScenario({ now: new Date(2026, 9, 25, 9, 0, 0) });
    const description = TEXT.fullMoonNightDescription("22:00", "05:59", 99);
    assert.match(description, /22:00/);
    assert.match(description, /05:59/);
    assert.match(description, /99/);
    const secret = { title: TEXT.fullMoonNightTitle(), description, hint: TEXT.fullMoonNightHint() };

    assert.ok(showsMissing(listRows(), secret, LIST_TEXT.secretTitle));

    waitUntil(2026, 9, 25, 21, 59);
    assert.ok(!(await play()).includes(secret.title), "21:59 on a full-moon night");
    waitUntil(2026, 9, 26, 6, 0);
    assert.ok(!(await play()).includes(secret.title), "06:00 on a full-moon night");
    waitUntil(2026, 9, 26, 15, 0);
    assert.ok(!(await play()).includes(secret.title), "a full-moon afternoon");
    // New moon on 9 November 2026.
    waitUntil(2026, 10, 8, 23, 0);
    assert.ok(!(await play()).includes(secret.title), "a new-moon night");

    // Full moon on the night of 23 to 24 December 2026.
    await switchTo("Alice");
    waitUntil(2026, 11, 23, 22, 0);
    assert.ok((await play()).includes(secret.title), "Alice, at 22:00 in 2026");

    await switchTo("guest");
    waitUntil(2026, 11, 23, 23, 0);
    assert.ok(!(await play(SHORT_GAME_MS)).includes(secret.title), "a game under a minute");
    waitUntil(2026, 11, 24, 5, 59);
    assert.ok((await play()).includes(secret.title), "Guest, at 05:59 in 2026");
    assert.ok(showsUnlocked(listRows(), secret));

    // Full moon on the night of 20 to 21 February 2027.
    await switchTo("Alice");
    store.resetProfile("Alice");
    waitUntil(2027, 1, 20, 22, 0);
    assert.ok((await play()).includes(secret.title), "Alice again after a reset, at 22:00 in 2027");
    store.resetProfile("Alice");
    waitUntil(2027, 1, 21, 5, 59);
    assert.ok((await play()).includes(secret.title), "Alice again after a reset, at 05:59 in 2027");

    // A Child Profile: no row, no toast, even under the full moon of 20 April 2027.
    await switchTo("Bob");
    waitUntil(2027, 3, 20, 23, 0);
    assert.ok(!(await play()).includes(secret.title), "never for a Child Profile");
    assert.ok(!listRows().some(row => row.description === secret.hint || row.title === secret.title));

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
