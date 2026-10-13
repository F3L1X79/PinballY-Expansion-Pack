// ============================================================
// A removed Profile's places on the boards, through main.js on the fake
// PinballY globals: they read as Default Scores, counted for nobody, the
// High Scores file left as it was; a Profile re-created under the same
// name gets them back.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, board, FACTORY, MEDIEVAL, PROFILES_FOLDER, HIGH_SCORES_FILE } from "./high_scores_scenario.js";
import { getHighScoreStore } from "../../common/high_scores/high_score_store.js";

test("a removed Profile's places count for nobody until a Profile of that name comes back", async () => {
    const { fake, setBoard, play, switchTo, showEveryToast } = await startHighScores({
        addOns: ["highScores", "achievements"], profiles: { Alice: {}, Bob: {} }, active: "Alice",
    });
    const { readProfileStats } = await import("../../addons/achievements_engine.js");
    setBoard(MEDIEVAL, FACTORY);
    await play(MEDIEVAL, { after: board(["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    switchTo("Bob");
    await play(MEDIEVAL, { after: board(["ALI", "60000000"], ["BOB", "55000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]) });
    await showEveryToast();
    const file = fake.readFile(HIGH_SCORES_FILE);

    fake.removeFolder(`${PROFILES_FOLDER}\\Alice`);
    assert.deepEqual(getHighScoreStore().heldBy("Alice"), { highScores: 0, tableRecords: 0 });
    assert.deepEqual(readProfileStats("Bob").boards, { highScores: 1, tableRecords: 0 }, "her Table Record is nobody's");
    assert.equal(fake.readFile(HIGH_SCORES_FILE), file, "nothing rewritten");

    fake.addFile(`${PROFILES_FOLDER}\\Alice\\profile.json`, JSON.stringify({ version: 1, plays: {}, notified: [] }));
    assert.deepEqual(readProfileStats("Alice").boards, { highScores: 1, tableRecords: 1 });
});
