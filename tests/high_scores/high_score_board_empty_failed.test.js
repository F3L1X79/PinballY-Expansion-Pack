// ============================================================
// The High Score Board on a known empty board whose read fails, through
// main.js on the fake PinballY globals: "No score yet" stays, with the
// note that it could not be refreshed.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { startHighScores, EMPTY_BOARD, MEDIEVAL } from "./high_scores_scenario.js";
import { openBoard, message, note } from "./high_score_board_reader.js";

test("a failed read over an empty board says it could not be refreshed", async () => {
    const { fake, setBoard, play } = await startHighScores();
    const { default: lang } = await import("../../common/core/i18n.js");
    setBoard(MEDIEVAL, EMPTY_BOARD);
    await play(MEDIEVAL);
    setBoard(MEDIEVAL, EMPTY_BOARD, { fails: true });

    openBoard(fake, lang);
    fake.advanceTime(1000);
    await settle();

    assert.equal(message(fake), "No score yet");
    assert.equal(note(fake), "These scores could not be refreshed");
});
