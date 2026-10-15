// ============================================================
// ROM-less High Scores without a VPReg.stg, through main.js on the fake
// PinballY globals: a Play on an original table whose VPX User folder
// holds no VPReg.stg logs one line, credits nothing and throws nothing.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, ZELDA, ZELDA_TABLE } from "./high_scores_scenario.js";

test("a missing VPReg.stg costs only that table's credit, with one log line", async () => {
    const { fake, play, saved, log, toasts } = await startHighScores({ profiles: { Alice: {} }, active: "Alice", tables: [ZELDA_TABLE] });

    await play(ZELDA);

    assert.deepEqual(log().filter(line => !line.includes("the high scores read failed")), [
        `[HighScores] "${ZELDA}": no board after the game; nothing credited, the last known board kept (VPReg.stg: C:\\vPinball\\VisualPinball\\User\\VPReg.stg not found).`,
    ]);
    assert.equal(saved(), undefined);
    assert.deepEqual(toasts(), []);
    assert.deepEqual(fake.logLines().filter(line => /error/i.test(line) && !line.includes("the high scores read failed")), []);
});
