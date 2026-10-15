// ============================================================
// The High Score Toast among the other toasts of a Play, through main.js
// on the fake PinballY globals: after a first Play that enters the board,
// the Mastery and Achievement toasts and the High Score Toast all show,
// one card each, the High Score Toast after those of the game and before
// the High Scores Achievement it brought; no board opens by itself.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, MEDIEVAL } from "./high_scores_scenario.js";

// Long enough for every toast of a Play, shown five at a time.
const ALL_TOASTS_MS = 30000;

test("the High Score Toast waits its turn with the Mastery and Achievement toasts", async () => {
    const { fake, setBoard, play, toasts } = await startHighScores({
        addOns: ["highScores", "achievements", "tableMastery", "sessionStatsTracker"], profiles: { Alice: {} }, active: "Alice",
    });
    setBoard(MEDIEVAL, board(["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"], ["RCF", "10000000"]));

    await play(MEDIEVAL, { after: board(["SLL", "52000000"], ["AAA", "45000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    fake.advanceTime(ALL_TOASTS_MS);

    const shown = toasts();
    assert.equal(shown[0], "1 | TABLE MASTERY | Rookie (1) | Medieval Madness");
    const highScoreToast = shown.indexOf("2 | HIGH SCORE | High score on Medieval Madness: 2nd place | 45,000,000 points");
    const gameToasts = shown.filter(toast => toast.startsWith("ACHIEVEMENT UNLOCKED") && !toast.includes("Initials in Stone"));
    assert.ok(gameToasts.length > 0 && gameToasts.every(toast => shown.indexOf(toast) < highScoreToast), shown.join("\n"));
    assert.equal(shown[highScoreToast + 1], "ACHIEVEMENT UNLOCKED | Initials in Stone | Win a High Score on a table.");
    assert.equal(new Set(shown).size, shown.length, "each card drawn once");
    assert.equal(fake.executedCommands().includes(globalThis.command.HighScores), false, "no High Scores window");
});
