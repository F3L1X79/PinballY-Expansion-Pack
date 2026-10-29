// ============================================================
// The High Score store's lostRecordsOf() on a seeded high_scores.json: a
// Table Record taken from the Profile since it last saw its Lost Records
// is one, once per table, unless the Profile holds it again. The Welcome
// Screen draws at once on its turn: no player flow reaches these last two
// cases.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import { createProfileStore } from "../../common/profiles/profile_store.js";
import { createHighScoreStore } from "../../common/high_scores/high_score_store.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";

const place = (rank, owner) => ({ rank, initials: "AAA", score: 1000 - rank, owner });
const BOB_TOOK_IT = { profile: "Bob", configId: "mm", score: 999, initials: "BOB", place: 1, date: "2026-10-10T20:00:00", tableRecord: true, takenFrom: "Alice" };

// board: mm's last known board; highScores: the High Scores ever won.
function setUp(board, highScores = [BOB_TOOK_IT]) {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 18, 20, 0, 0), tables: [] });
    fake.installGlobals();
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    for (const name of ["Alice", "Bob", "Claire"]) fake.addFile(`${PROFILES}\\${name}\\profile.json`, JSON.stringify({ version: 1, plays: {} }));
    fake.addFile(`${PROFILES}\\high_scores.json`, JSON.stringify({
        version: 1, tables: { mm: { board } }, highScores, lostRecordsSeen: { alice: "2026-10-01T20:00:00" },
    }));
    return createHighScoreStore(fake, createProfileStore(fake));
}

test("a Table Record taken since last seen is a Lost Record", () => {
    const store = setUp([place(1, "Bob"), place(2, "Alice")]);

    assert.deepEqual(store.lostRecordsOf("Alice", ["mm"]).map(lost => lost.configId), ["mm"]);
});

test("a table taken twice counts once, with its most recent taker", () => {
    const store = setUp([place(1, "Claire"), place(2, "Bob")], [
        BOB_TOOK_IT,
        { ...BOB_TOOK_IT, profile: "Claire", initials: "CLA", date: "2026-10-12T20:00:00" },
    ]);

    assert.deepEqual(store.lostRecordsOf("Alice", ["mm"]).map(lost => [lost.configId, lost.taker.name]), [["mm", "Claire"]]);
});

test("a Table Record held again is no Lost Record", () => {
    const store = setUp([place(1, "Alice"), place(2, "Bob")]);

    assert.deepEqual(store.lostRecordsOf("Alice", ["mm"]), []);
});
