// ============================================================
// The High Score store's placesHeldBy(), on the fake PinballY host with a
// real Profile store and a seeded high_scores.json: each table where the
// Profile holds a place on the last known board, with its best place
// there. A High Score pushed off the board, a table never read and a
// removed Profile's places are left out.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import { createProfileStore } from "../../common/profiles/profile_store.js";
import { createHighScoreStore } from "../../common/high_scores/high_score_store.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";

const place = (rank, owner) => ({ rank, initials: "AAA", score: 1000 - rank, owner });

// boards: { configId: board }; highScores: the High Scores ever won.
function setUp({ boards, highScores = [] }) {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 18, 20, 0, 0), tables: [] });
    fake.installGlobals();
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({ version: 1, plays: {} }));
    fake.addFile(`${PROFILES}\\Bob\\profile.json`, JSON.stringify({ version: 1, plays: {} }));
    const tables = Object.fromEntries(Object.entries(boards).map(([configId, board]) => [configId, { board }]));
    fake.addFile(`${PROFILES}\\high_scores.json`, JSON.stringify({ version: 1, tables, highScores }));
    return { fake, store: createHighScoreStore(fake, createProfileStore(fake)) };
}

test("each table where the Profile holds a place, with its best place there", () => {
    const { store } = setUp({
        boards: {
            mm: [place(1, "Bob"), place(2, "Alice"), place(3, "alice")],
            afm: [place(1, null), place(2, "Bob")],
            tz: [place(1, "Alice")],
        },
    });

    assert.deepEqual(store.placesHeldBy("Alice"), [{ configId: "mm", bestPlace: 2 }, { configId: "tz", bestPlace: 1 }]);
    assert.deepEqual(store.placesHeldBy("Bob"), [{ configId: "mm", bestPlace: 1 }, { configId: "afm", bestPlace: 2 }]);
});

test("a High Score pushed off the board leaves its table out", () => {
    const { store } = setUp({
        boards: { mm: [place(1, "Bob"), place(2, null)] },
        highScores: [{ profile: "Alice", configId: "mm", score: 500, initials: "ALI", place: 2, date: "2026-10-01T20:00:00", tableRecord: false, takenFrom: null }],
    });

    assert.deepEqual(store.placesHeldBy("Alice"), []);
});

test("a table never read is left out", () => {
    // afm's entry holds no board yet.
    const { store } = setUp({ boards: { afm: undefined, mm: [place(1, "Alice")] } });

    assert.deepEqual(store.placesHeldBy("Alice"), [{ configId: "mm", bestPlace: 1 }]);
});

test("a removed Profile holds no place, nothing rewritten", () => {
    const { fake, store } = setUp({ boards: { mm: [place(1, "Alice")] } });
    const file = fake.readFile(`${PROFILES}\\high_scores.json`);

    fake.removeFolder(`${PROFILES}\\Alice`);

    assert.deepEqual(store.placesHeldBy("Alice"), []);
    assert.equal(fake.readFile(`${PROFILES}\\high_scores.json`), file);
});
