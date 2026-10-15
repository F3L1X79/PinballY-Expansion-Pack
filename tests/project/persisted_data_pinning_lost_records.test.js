// ============================================================
// Pinning test of the Lost Records' seen markers: their key in
// high_scores.json, by lower-case Profile name. These strings are
// players' saved progress: this test must keep passing unchanged.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import { createProfileStore } from "../../common/profiles/profile_store.js";
import { createHighScoreStore } from "../../common/high_scores/high_score_store.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";

test("the High Score store keeps the key of each Profile's Lost Records seen marker", () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 15, 20, 0, 0), tables: [] });
    fake.addFile(`${PROFILES_FOLDER}\\Alice\\profile.json`, JSON.stringify({ version: 1 }));
    const highScores = createHighScoreStore(fake, createProfileStore(fake));

    highScores.markLostRecordsSeen("Alice");

    assert.deepEqual(JSON.parse(fake.readFile(`${PROFILES_FOLDER}\\high_scores.json`)).lostRecordsSeen, { alice: "2026-10-15T20:00:00" });
});
