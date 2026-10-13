// ============================================================
// The High Scores Add-on turned off in config.addOns, through main.js on
// the fake PinballY globals: no board is read and its file is never
// written, no toast shows, the boards and High Scores it knew left as
// they were.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, boardLines, MEDIEVAL, HIGH_SCORES_FILE } from "./high_scores_scenario.js";

const KNOWN = JSON.stringify({
    version: 1,
    tables: { [MEDIEVAL]: { board: [{ rank: 1, initials: "SLL", score: 52000000, owner: null }] } },
    highScores: [],
});

test("with the Add-on off, nothing is read, written or shown", async () => {
    const { fake, setBoard, play, log, toasts } = await startHighScores({
        addOns: [], profiles: { Alice: {} }, active: "Alice", files: { [HIGH_SCORES_FILE]: KNOWN },
    });
    const requests = [];
    globalThis.gameList.on("highscoresrequest", ev => requests.push(ev.game.configId));
    setBoard(MEDIEVAL, boardLines(["SLL", "52000000"], [["BRE", "40000000"]]));

    await play(MEDIEVAL, { after: boardLines(["ALI", "60000000"], [["SLL", "52000000"], ["BRE", "40000000"]]) });

    assert.deepEqual(requests, []);
    assert.equal(fake.readFile(HIGH_SCORES_FILE), KNOWN);
    assert.deepEqual(log(), []);
    assert.deepEqual(toasts(), []);
});
