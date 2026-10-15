// ============================================================
// A Lost Record taken back, through main.js on the fake PinballY globals:
// Bob took Alice's Table Record, then Alice took it back before her
// Welcome Screen showed, so the screen tells her nothing and is laid out
// as one without any Lost Record.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startLostRecords, recordBoard } from "./lost_records_scenario.js";
import { welcomeScreenLayout } from "./welcome_screen_reader.js";
import { board, MEDIEVAL, FACTORY } from "../high_scores/high_scores_scenario.js";

const BOB_RECORD = board(["BOB", "70000000"], ["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]);
const ALICE_BACK = board(["ALI", "80000000"], ["BOB", "70000000"], ["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"]);

test("a Table Record taken back before the Welcome Screen leaves no line", async () => {
    const scenario = await startLostRecords({ profiles: { Alice: {}, Bob: {} }, active: "Alice" });
    const { fake, setBoard, play, playAs, arrive, close, line, seenMarkers } = scenario;
    setBoard(MEDIEVAL, FACTORY);

    await play(MEDIEVAL, { after: recordBoard("ALI", 60) });
    await arrive("Alice");
    const layoutWithoutLostRecord = welcomeScreenLayout(fake);
    await close();
    await arrive("Bob");
    await close();
    await play(MEDIEVAL, { after: BOB_RECORD });
    const aliceMarker = seenMarkers().alice;
    await playAs("Alice", MEDIEVAL, ALICE_BACK);
    assert.equal(seenMarkers().alice, aliceMarker, "no Welcome Screen showed before the Play");

    await arrive("Bob");
    await close();
    await arrive("Alice");
    assert.equal(line(), null, "Alice holds the Table Record again");
    assert.deepEqual(welcomeScreenLayout(fake), layoutWithoutLostRecord, "laid out as before Bob took it");
    assert.deepEqual(fake.logLines().filter(text => text.includes("ERROR")), []);
});
