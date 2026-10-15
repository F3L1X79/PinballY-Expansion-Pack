// ============================================================
// A Lost Record on the Welcome Screen in French, through main.js on the
// fake PinballY globals, its taker's Avatar file missing (nor the default
// Avatar): the line is still shown, text only, and the missing image logged.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startLostRecords } from "./lost_records_scenario.js";
import { board, MEDIEVAL, FACTORY } from "../high_scores/high_scores_scenario.js";

test("in French, the line names the taker and the table, text only when the taker's Avatar is missing", async () => {
    const { fake, setBoard, play, arrive, close, line, lineImages } = await startLostRecords({
        profiles: { Alice: {}, Bob: {} }, active: "Alice", language: "fr",
    });
    setBoard(MEDIEVAL, FACTORY);

    await play(MEDIEVAL, { after: board(["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    await arrive("Bob");
    await close();
    await play(MEDIEVAL, { after: board(["BOB", "70000000"], ["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]) });
    await arrive("Alice");

    assert.equal(line(), "Bob t'a pris ton record sur Medieval Madness");
    assert.deepEqual(lineImages(), []);
    assert.equal(fake.logLines().filter(text => text.startsWith("[WelcomeScreen]") && text.includes("without Bob's Avatar")).length, 1);
});
