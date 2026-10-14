// ============================================================
// The High Score Board with the High Scores Add-on off, through main.js
// on the fake PinballY globals: no entry for it in the main menu.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores } from "./high_scores_scenario.js";
import { mainMenuTitles } from "./high_score_board_reader.js";

test("without the High Scores Add-on, the main menu has no High Score Board entry", async () => {
    const { fake } = await startHighScores({ addOns: ["customMenuCommands"] });
    assert.equal(mainMenuTitles(fake).boardEntry, -1);
});
