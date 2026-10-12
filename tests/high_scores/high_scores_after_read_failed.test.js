// ============================================================
// The read after a Play going wrong, through main.js on the fake PinballY
// globals: whether PINemHi fails, is killed by PinballY, never answers or
// no longer supports the ROM, nothing is credited, the last known board is
// kept as it was, and the reason is logged.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, boardLines, MEDIEVAL, NOT_SUPPORTED } from "./high_scores_scenario.js";

const KNOWN = boardLines(["SLL", "52000000"], [["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]]);
const AFTER = boardLines(["ALI", "60000000"], [["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]]);
const NO_BOARD = `[HighScores] "${MEDIEVAL}": no board after the game; nothing credited, the last known board kept.`;

test("a failed, killed, unanswered or unsupported read after a Play credits nothing and keeps the last known board", async () => {
    const { setBoard, play, saved, log, pendingTimerCount } = await startHighScores({ profiles: { Alice: {} }, active: "Alice" });
    setBoard(MEDIEVAL, KNOWN);
    await play(MEDIEVAL);
    const known = saved();
    const timersBefore = pendingTimerCount();

    for (const [after, afterRead] of [[AFTER, { fails: true }], [AFTER, { durationMs: 9000 }], [AFTER, { hangs: true }], [NOT_SUPPORTED, {}]]) {
        setBoard(MEDIEVAL, KNOWN);
        await play(MEDIEVAL, { after, afterRead });
    }

    assert.deepEqual(saved(), known);
    assert.equal(pendingTimerCount(), timersBefore);
    assert.deepEqual(log().slice(2), [
        `[HighScores] "${MEDIEVAL}": the high scores read failed (PINemHi could not read the high scores.).`,
        NO_BOARD,
        `[HighScores] "${MEDIEVAL}": the high scores read failed (PINemHi could not read the high scores.).`,
        NO_BOARD,
        `[HighScores] "${MEDIEVAL}": the high scores read timed out.`,
        NO_BOARD,
        `[HighScores] "${MEDIEVAL}": PINemHi does not support its ROM.`,
        NO_BOARD,
    ]);
});
