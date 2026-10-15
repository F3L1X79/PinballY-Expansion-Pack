// ============================================================
// Lost Records and Guest, through main.js on the fake PinballY globals: a
// Table Record taken from Alice, a Child Profile, by someone playing as
// Guest is told under Guest's name, while Guest, which anyone can be, is
// never told one nor given a seen marker.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startLostRecords } from "./lost_records_scenario.js";
import { board, MEDIEVAL, FACTORY } from "../high_scores/high_scores_scenario.js";

test("a record taken as Guest names Guest, and Guest is never told one", async () => {
    const { setBoard, play, arrive, close, line, seenMarkers } = await startLostRecords({ profiles: { Alice: { isChild: true } }, active: "Alice" });
    setBoard(MEDIEVAL, FACTORY);

    await play(MEDIEVAL, { after: board(["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    await arrive("guest");
    await close();
    await play(MEDIEVAL, { after: board(["GST", "70000000"], ["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]) });
    await arrive("Alice");
    assert.equal(line(), "Guest took your record on Medieval Madness");
    await close();

    await play(MEDIEVAL, { after: board(["ALI", "80000000"], ["GST", "70000000"], ["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"]) });
    await arrive("guest");
    assert.equal(line(), null, "Guest lost its record to Alice, but is never told");
    assert.deepEqual(Object.keys(seenMarkers()), ["alice"]);
});
