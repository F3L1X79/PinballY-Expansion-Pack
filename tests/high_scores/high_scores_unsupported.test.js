// ============================================================
// A table whose ROM PINemHi does not support, through main.js on the fake
// PinballY globals: its Plays only leave log lines, nothing is saved for
// it and nothing is credited.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, MEDIEVAL, NOT_SUPPORTED } from "./high_scores_scenario.js";

test("a table PINemHi does not support stays silent apart from the log", async () => {
    const { setBoard, play, saved, log } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    setBoard(MEDIEVAL, NOT_SUPPORTED);

    await play(MEDIEVAL);

    assert.equal(saved(), undefined);
    assert.deepEqual(log(), [
        `[HighScores] "${MEDIEVAL}": PINemHi does not support its ROM.`,
        `[HighScores] "${MEDIEVAL}": PINemHi does not support its ROM.`,
        `[HighScores] "${MEDIEVAL}": no board after the game; nothing credited, the last known board kept.`,
    ]);
});
