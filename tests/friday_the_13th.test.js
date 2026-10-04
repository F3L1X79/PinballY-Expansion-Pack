// ============================================================
// Friday the 13th, a Platinum secret of the Surprises family, started
// through main.js on the fake PinballY globals: only a Play started on a
// Friday the 13th unlocks it, with a Confetti Shower; a Friday 12, a
// Thursday 13 or a game under a minute do not. While missing, its row
// shows "???" and its hint.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startSurprisesScenario, showsMissing, showsUnlocked, SHORT_GAME_MS } from "./surprises_scenario.js";
import { showerStartLogs } from "./confetti_shower_scenario.js";

test("only a Play started on a Friday the 13th unlocks Friday the 13th, with a Confetti Shower", async () => {
    // Monday 1 June 2026.
    const { fake, TEXT, LIST_TEXT, waitUntil, play, listRows } = await startSurprisesScenario({ now: new Date(2026, 5, 1, 10, 0, 0) });
    const secret = {
        title: TEXT.fridayThe13thTitle(), description: TEXT.fridayThe13thDescription(), hint: TEXT.fridayThe13thHint(),
    };

    assert.ok(showsMissing(listRows(), secret, LIST_TEXT.secretTitle));

    waitUntil(2026, 5, 12, 20, 0);
    assert.ok(!(await play()).includes(secret.title), "a Friday 12");
    waitUntil(2026, 7, 13, 20, 0);
    assert.ok(!(await play()).includes(secret.title), "a Thursday 13");
    waitUntil(2026, 10, 13, 20, 0);
    assert.ok(!(await play(SHORT_GAME_MS)).includes(secret.title), "a game under a minute on a Friday 13");
    assert.equal(showerStartLogs(fake).length, 0);

    waitUntil(2026, 10, 13, 21, 0);
    assert.ok((await play()).includes(secret.title), "a Play on Friday 13 November 2026");
    assert.equal(showerStartLogs(fake).length, 1, "a Platinum's Confetti Shower");
    assert.ok(showsUnlocked(listRows(), secret));

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
