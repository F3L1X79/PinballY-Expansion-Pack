// ============================================================
// A Lost Record whose taker was removed, through main.js on the fake
// PinballY globals: Bob took Alice's Table Record on Medieval Madness and
// Claire hers on Attack from Mars, then Bob's Profile was removed (his
// High Scores are Default Scores now), so Alice is only told of Claire's.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startLostRecords, recordBoard } from "./lost_records_scenario.js";
import { MEDIEVAL, AFM, FACTORY, PROFILES_FOLDER } from "../high_scores/high_scores_scenario.js";

test("a Lost Record whose taker was removed is left out", async () => {
    const { fake, setBoard, play, playAs, arrive, close, line } = await startLostRecords({
        profiles: { Alice: {}, Bob: {}, Claire: {} }, active: "Alice",
    });
    setBoard(MEDIEVAL, FACTORY);
    setBoard(AFM, FACTORY);

    await play(MEDIEVAL, { after: recordBoard("ALI", 60) });
    await play(AFM, { after: recordBoard("ALI", 60) });
    await playAs("Bob", MEDIEVAL, recordBoard("BOB", 70));
    await playAs("Claire", AFM, recordBoard("CLA", 70));
    fake.removeFolder(`${PROFILES_FOLDER}\\Bob`);

    await arrive("Alice");
    assert.equal(line(), "Claire took your record on Attack from Mars");
    await close();
    assert.deepEqual(fake.logLines().filter(text => text.includes("ERROR")), []);
});
