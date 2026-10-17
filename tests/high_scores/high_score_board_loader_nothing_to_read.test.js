// ============================================================
// The High Score Board with nothing to read, through main.js on the fake
// PinballY globals: opened by the HighScores button on an empty wheel, it
// reads no board, so no Loader turns over it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { loaderLayerCount } from "../support/loader_reader.js";
import { startHighScores } from "./high_scores_scenario.js";
import { isBoardOpen, BOARD_OPEN_MS } from "./high_score_board_reader.js";

test("a board opened with no table to read shows no Loader", async () => {
    const { fake } = await startHighScores({ tables: [] });

    fake.runCommand(globalThis.command.HighScores);
    assert.equal(loaderLayerCount(fake), 0, "no Loader at opening");
    fake.advanceTime(BOARD_OPEN_MS);
    assert.ok(isBoardOpen(fake), "the board is open");
    assert.equal(loaderLayerCount(fake), 0, "still none once faded in");
    assertNoErrorLogged(fake);
});
