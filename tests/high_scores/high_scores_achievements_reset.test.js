// ============================================================
// The High Scores Achievements after a Profile Reset, through main.js on
// the fake PinballY globals: the Profile's High Scores stay in the store,
// its Achievements count afresh from the reset.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, FACTORY, SECOND_PLACE, romTables } from "./high_scores_scenario.js";

const [T1, T2] = romTables(2).map(table => table.configId);

test("after a Profile Reset, the High Scores are kept and the Achievements count afresh", async () => {
    const { setBoard, play, showEveryToast, notified, readShown, resetProfile, saved } = await startHighScores({
        addOns: ["highScores", "achievements", "customMenuCommands"], profiles: { Alice: {} }, active: "Alice", tables: romTables(2),
    });
    setBoard(T1, FACTORY);
    setBoard(T2, FACTORY);
    await play(T1, { after: SECOND_PLACE });
    await showEveryToast();
    assert.ok(notified("Alice").includes("highScoreTables:1"));

    resetProfile("Alice");
    assert.deepEqual(saved().highScores.map(({ profile, configId }) => [profile, configId]), [["Alice", T1]]);
    assert.deepEqual(readShown(["Initials in Stone"]), [{ title: "Initials in Stone", progress: null, unlocked: false }]);

    await play(T2, { after: SECOND_PLACE });
    await showEveryToast();
    assert.ok(notified("Alice").includes("highScoreTables:1"), "announced again");
    assert.deepEqual(readShown(["Three Banners Raised"]), [{ title: "Three Banners Raised", progress: "1/3", unlocked: false }]);
});
