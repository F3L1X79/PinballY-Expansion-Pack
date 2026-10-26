// ============================================================
// The Pack Version and its semver comparison, which the Update Check and
// the release script share. Never loaded by PinballY.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { PACK_VERSION, isNewerPackVersion } from "../../common/core/pack_version.js";

test("the Pack Version is a plain semver number", () => {
    assert.match(PACK_VERSION, /^\d+\.\d+\.\d+$/);
});

test("versions are ordered by major, then minor, then patch", () => {
    const ordered = ["0.1.0", "0.1.1", "0.2.0", "0.10.0", "1.0.0"];
    for (let i = 0; i < ordered.length; i++) {
        for (let j = 0; j < ordered.length; j++) {
            assert.equal(isNewerPackVersion(ordered[j], ordered[i]), j > i, `${ordered[j]} newer than ${ordered[i]}`);
        }
    }
});

test("a leading v is ignored, as in the release tags", () => {
    assert.equal(isNewerPackVersion("v0.2.0", "0.1.0"), true);
    assert.equal(isNewerPackVersion("v0.1.0", "v0.1.0"), false);
    assert.equal(isNewerPackVersion("0.1.1", "v0.1.0"), true);
});

test("an unparsable version is never newer", () => {
    for (const candidate of ["", "latest", "1.0", "1.0.0-beta.1", "v", null, undefined, 2]) {
        assert.equal(isNewerPackVersion(candidate, "0.1.0"), false, `${candidate}`);
    }
});

test("by default a version is compared with the running Pack Version", () => {
    assert.equal(isNewerPackVersion(PACK_VERSION), false);
    assert.equal(isNewerPackVersion("999.0.0"), true);
});
