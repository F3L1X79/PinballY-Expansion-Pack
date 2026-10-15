// ============================================================
// The High Scores Achievements counted in tables, through main.js on the
// fake PinballY globals: High Scores on 1, 3, 5 and 10 tables, four
// places on one table counting as one, each Achievement Notified after
// the Play that reached it, with its Achievement Progress in the
// Achievement List until then.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, FACTORY, SECOND_PLACE, highScoreIds, romTables } from "./high_scores_scenario.js";

const TABLES = romTables(10);

test("High Scores on 1, 3, 5 and 10 tables, counted in tables, each Notified after its Play", async () => {
    const { setBoard, play, showEveryToast, notified, readShown } = await startHighScores({
        addOns: ["highScores", "achievements", "customMenuCommands"], profiles: { Alice: {} }, active: "Alice", tables: TABLES,
    });
    for (const { configId } of TABLES) setBoard(configId, FACTORY);

    // A four-player game: four places on one table.
    await play(TABLES[0].configId, { after: board(["SLL", "52000000"], ["AAA", "48000000"], ["BBB", "45000000"], ["CCC", "42000000"], ["DDD", "41000000"]) });
    await showEveryToast();
    assert.deepEqual(highScoreIds(notified("Alice")), ["highScoreTables:1"]);
    assert.deepEqual(readShown(["Initials in Stone", "Three Banners Raised", "Lord of the Five Boards", "The Kwisatz Hiscorach"]), [
        { title: "Initials in Stone", progress: null, unlocked: true },
        { title: "Three Banners Raised", progress: "1/3", unlocked: false },
        { title: "Lord of the Five Boards", progress: "1/5", unlocked: false },
        { title: "The Kwisatz Hiscorach", progress: "1/10", unlocked: false },
    ]);

    const reached = [];
    for (const { configId } of TABLES.slice(1)) {
        await play(configId, { after: SECOND_PLACE });
        await showEveryToast();
        reached.push(highScoreIds(notified("Alice")).length);
    }
    // After tables 2 to 10: the third, fifth and tenth bring their Achievement.
    assert.deepEqual(reached, [1, 2, 2, 3, 3, 3, 3, 3, 4]);
    assert.deepEqual(highScoreIds(notified("Alice")), ["highScoreTables:1", "highScoreTables:3", "highScoreTables:5", "highScoreTables:10"]);
});
