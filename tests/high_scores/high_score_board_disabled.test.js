// ============================================================
// The High Score Board with the High Scores Add-on off, through main.js
// on the fake PinballY globals: no entry for it in the main menu,
// PinballY's own High Scores entry is back as "Table Scores", and the HighScores button
// reaches PinballY.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores } from "./high_scores_scenario.js";
import { mainMenuTitles, isBoardOpen } from "./high_score_board_reader.js";

test("without the High Scores Add-on, PinballY's own High Scores is back as Table Scores", async () => {
    const { fake } = await startHighScores({ addOns: ["customMenuCommands"] });
    const HIGH_SCORES = globalThis.command.HighScores;

    const { titles, boardEntry } = mainMenuTitles(fake);
    assert.equal(boardEntry, -1);
    assert.equal(titles.filter(entry => entry === "Table Scores").length, 1);
    assert.equal(titles.includes("High Scores"), false, titles.join(" | "));

    fake.runCommand(HIGH_SCORES);
    assert.ok(fake.executedCommands().includes(HIGH_SCORES));
    assert.ok(!isBoardOpen(fake));
});
