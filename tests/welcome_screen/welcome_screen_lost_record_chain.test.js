// ============================================================
// A Table Record taken twice, through main.js on the fake PinballY
// globals: Bob took Alice's, then Claire took it from Bob before either
// came back. Alice is told that Bob took it, who beat her, and Bob that
// Claire did.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startLostRecords, recordBoard } from "./lost_records_scenario.js";
import { MEDIEVAL, FACTORY } from "../high_scores/high_scores_scenario.js";

test("each Profile is told who took the Table Record from it", async () => {
    const { fake, setBoard, play, playAs, arrive, close, line } = await startLostRecords({
        profiles: { Alice: {}, Bob: {}, Claire: {} }, active: "Alice",
    });
    setBoard(MEDIEVAL, FACTORY);

    await play(MEDIEVAL, { after: recordBoard("ALI", 60) });
    await arrive("Bob");
    await close();
    await play(MEDIEVAL, { after: recordBoard("BOB", 70) });
    await playAs("Claire", MEDIEVAL, recordBoard("CLA", 80));

    await arrive("Alice");
    assert.equal(line(), "Bob took your record on Medieval Madness");
    await close();
    await arrive("Bob");
    assert.equal(line(), "Claire took your record on Medieval Madness");
    assert.deepEqual(fake.logLines().filter(text => text.includes("ERROR")), []);
});
