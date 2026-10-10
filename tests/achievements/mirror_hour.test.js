// ============================================================
// Mirror Hour, a secret of the Surprises family, started through main.js
// on the fake PinballY globals: only a Play started at hh:mm where hours
// equal minutes unlocks it, from 00:00 to 23:23, for every Profile, a
// Child Profile included at any hour; 11:12 or a game under a minute do
// not. While missing, its row shows "???" and its hint.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startSurprisesScenario, showsMissing, showsUnlocked, SHORT_GAME_MS } from "./surprises_scenario.js";

test("only a Play started when hours equal minutes unlocks Mirror Hour, a Child Profile included", async () => {
    // Monday 5 October 2026.
    const { fake, store, TEXT, LIST_TEXT, waitUntil, play, listRows, switchTo } = await startSurprisesScenario({ now: new Date(2026, 9, 5, 9, 0, 0) });
    const secret = { title: TEXT.mirrorHourTitle(), description: TEXT.mirrorHourDescription(), hint: TEXT.mirrorHourHint() };

    assert.ok(showsMissing(listRows(), secret, LIST_TEXT.secretTitle));

    waitUntil(2026, 9, 5, 11, 12);
    assert.ok(!(await play()).includes(secret.title), "11:12");
    waitUntil(2026, 9, 6, 11, 11);
    assert.ok(!(await play(SHORT_GAME_MS)).includes(secret.title), "a game under a minute at 11:11");
    waitUntil(2026, 9, 7, 11, 11);
    assert.ok((await play()).includes(secret.title), "Guest, at 11:11");
    assert.ok(showsUnlocked(listRows(), secret));

    await switchTo("Alice");
    waitUntil(2026, 9, 8, 0, 0);
    assert.ok((await play()).includes(secret.title), "Alice, at 00:00");
    store.resetProfile("Alice");
    waitUntil(2026, 9, 8, 23, 23);
    assert.ok((await play()).includes(secret.title), "Alice again after a reset, at 23:23");

    await switchTo("Bob");
    assert.ok(showsMissing(listRows(), secret, LIST_TEXT.secretTitle), "a Child Profile sees it too");
    waitUntil(2026, 9, 9, 1, 1);
    assert.ok((await play()).includes(secret.title), "a Child Profile, at 01:01");

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
