// ============================================================
// The High Scores Add-on turned off, through main.js on the fake PinballY
// globals: its Achievement family is absent from the Achievement List and
// none of it is Notified, whatever the board after a Play.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, FACTORY, highScoreIds, MEDIEVAL } from "./high_scores_scenario.js";

test("with the Add-on off, the High Scores family is absent and nothing of it is Notified", async () => {
    const { setBoard, play, showEveryToast, notified, readShown } = await startHighScores({
        addOns: ["achievements", "customMenuCommands"], profiles: { Alice: {} }, active: "Alice",
    });
    setBoard(MEDIEVAL, FACTORY);
    await play(MEDIEVAL, { after: board(["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    await showEveryToast();

    assert.deepEqual(highScoreIds(notified("Alice")), []);
    const [firstSteps, ...family] = readShown(["First Steps", "Initials in Stone", "One Score to Rule Them All", "The Usurper"]);
    assert.ok(firstSteps, "the list reads the other families");
    assert.deepEqual(family, [undefined, undefined, undefined]);
});
