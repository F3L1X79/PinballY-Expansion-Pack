// ============================================================
// Pinning test of the Pack Update's saved data: the update state file's
// name and keys, its line in .gitignore, and the UPDATE_CHECK key of
// .env.local. Owners' files carry these strings from one Pack Version to
// the next: this test must keep passing unchanged.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import { createUpdateState } from "../../common/updates/update_state.js";
import { applyEnvOverrides } from "../../common/core/env_overrides.js";
import { DEFAULTS } from "../../common/core/config.js";

const STATE_FILE = "C:\\PinballY\\Scripts\\ExpansionPack\\pack_update.json";
const RELEASE = { packVersion: "9.0.0", zipUrl: "https://example.com/ExpansionPack.zip", sha256: "ab".repeat(32) };

test("the update state file keeps its name and keys", () => {
    const fake = createFakePinballYHost();
    createUpdateState(fake).rememberRelease(RELEASE);

    assert.deepEqual(JSON.parse(fake.readFile(STATE_FILE)), { version: 1, latestRelease: RELEASE });

    const saved = createFakePinballYHost();
    saved.addFile(STATE_FILE, JSON.stringify({ version: 1, latestRelease: RELEASE }));
    assert.deepEqual(createUpdateState(saved).latestRelease(), RELEASE, "read back from an owner's file");
});

test("the update state file keeps its offered and requested versions' keys", () => {
    const fake = createFakePinballYHost();
    const state = createUpdateState(fake);
    state.markOffered("9.0.0");
    state.requestUpdate("9.0.0");

    assert.deepEqual(JSON.parse(fake.readFile(STATE_FILE)), { version: 1, offeredVersion: "9.0.0", requestedVersion: "9.0.0" });

    const saved = createFakePinballYHost();
    saved.addFile(STATE_FILE, JSON.stringify({ version: 1, offeredVersion: "9.0.0", requestedVersion: "9.0.0" }));
    const readBack = createUpdateState(saved);
    assert.equal(readBack.offeredVersion(), "9.0.0", "read back from an owner's file");
    assert.equal(readBack.requestedVersion(), "9.0.0");
});

test("the update state file keeps its previous version's key", () => {
    const fake = createFakePinballYHost();
    createUpdateState(fake).requestUpdate("9.0.0", "8.0.0");

    assert.deepEqual(JSON.parse(fake.readFile(STATE_FILE)), { version: 1, requestedVersion: "9.0.0", previousVersion: "8.0.0" });

    const saved = createFakePinballYHost();
    saved.addFile(STATE_FILE, JSON.stringify({ version: 1, requestedVersion: "9.0.0", previousVersion: "8.0.0" }));
    assert.equal(createUpdateState(saved).previousVersion(), "8.0.0", "read back from an owner's file");
});

test("the update state file stays out of git", () => {
    const lines = readFileSync(new URL("../../.gitignore", import.meta.url), "utf8").split(/\r?\n/);
    assert.ok(lines.includes("pack_update.json"));
});

test(".env.local keeps the UPDATE_CHECK key", () => {
    assert.equal(DEFAULTS.updateCheck, true);
    assert.equal(applyEnvOverrides(DEFAULTS, "UPDATE_CHECK=false\n").config.updateCheck, false);
});
