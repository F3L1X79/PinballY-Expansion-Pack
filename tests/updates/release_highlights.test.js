// ============================================================
// The Release Highlights a successful Pack Update shows: those of every
// Pack Version newer than the one the cabinet ran before and not newer than
// the running one, newest first, five sentences at most.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { selectReleaseHighlights } from "../../common/updates/release_highlights.js";

const HIGHLIGHTS = {
    "1.2.0": ["1.2 a"],
    "1.3.0": ["1.3 a", "1.3 b"],
    "1.4.0": ["1.4 a"],
    "1.5.0": ["1.5 a", "1.5 b", "1.5 c"],
    "1.6.0": ["1.6 a"],
};

const select = (previousVersion, runningVersion, releaseHighlights = HIGHLIGHTS) =>
    selectReleaseHighlights({ previousVersion, runningVersion, releaseHighlights });

test("one version up: only the running Pack Version's", () => {
    assert.deepEqual(select("1.4.0", "1.5.0"), ["1.5 a", "1.5 b", "1.5 c"]);
});

test("skipped versions included, newest first, none past the running one", () => {
    assert.deepEqual(select("1.2.0", "1.4.0"), ["1.4 a", "1.3 a", "1.3 b"]);
});

test("at most five sentences, the oldest dropped", () => {
    assert.deepEqual(select("1.1.0", "1.5.0"), ["1.5 a", "1.5 b", "1.5 c", "1.4 a", "1.3 a"]);
});

test("a version without entry adds nothing", () => {
    assert.deepEqual(select("1.5.0", "1.5.1"), []);
    assert.deepEqual(select("1.4.0", "1.5.1"), ["1.5 a", "1.5 b", "1.5 c"]);
});

test("the previous version equal to the running one: nothing", () => {
    assert.deepEqual(select("1.5.0", "1.5.0"), []);
});

test("no previous version recorded: only the running Pack Version's", () => {
    assert.deepEqual(select(null, "1.5.0"), ["1.5 a", "1.5 b", "1.5 c"]);
    assert.deepEqual(select(null, "1.5.1"), []);
});

test("no Release Highlights at all", () => {
    assert.deepEqual(select("1.0.0", "1.5.0", {}), []);
});
