// ============================================================
// Play Log at the PinballY host seam, on the fake host's in-memory file
// system: every Play (a game of at least one minute whose start was seen)
// is added to the Play Log of the Profile active at its start, in that
// Profile's play-log-<year>.json for the year it started; a year file is
// recovered from its backup or set aside like profile.json.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import { createProfileStore, MIN_PLAY_SECONDS } from "../../common/profile_store.js";

const NOW = new Date(2026, 9, 1, 21, 10, 0);
const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const GUEST_LOG_2026 = `${PROFILES}\\guest\\play-log-2026.json`;
const ALICE = `${PROFILES}\\Alice`;

const MEDIEVAL = { id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", isHidden: false };
const HIDDEN = { id: 2, configId: "Hidden Table (Gottlieb 1978)", title: "Hidden Table", isHidden: true };

function createFake(now = NOW) {
    return createFakePinballYHost({ now, tables: [MEDIEVAL, HIDDEN] });
}

function play(fake, game, seconds) {
    fake.gameStarted(game);
    fake.advanceTime(seconds * 1000);
    fake.gameOver(game);
}

const playLogJson = plays => JSON.stringify({ version: 1, plays });
const loggedAbout = (fake, pattern) => fake.logLines().some(line => line.startsWith("[ProfileStore]") && pattern.test(line));

test("a game of one minute or more is a Play in the Play Log of its year, with its start, table and seconds", () => {
    const fake = createFake();
    const store = createProfileStore(fake);

    play(fake, MEDIEVAL, 312.4);
    play(fake, HIDDEN, MIN_PLAY_SECONDS);

    assert.deepEqual(store.getPlayLogOf("guest", 2026), [
        { start: "2026-10-01T21:10:00", configId: MEDIEVAL.configId, seconds: 312 },
        { start: "2026-10-01T21:15:12", configId: HIDDEN.configId, seconds: 60 },
    ]);
    assert.equal(JSON.parse(fake.readFile(GUEST_LOG_2026)).version, 1);
});

test("a game under a minute, or one whose start was never seen, is not a Play", () => {
    const fake = createFake();
    const store = createProfileStore(fake);

    play(fake, MEDIEVAL, MIN_PLAY_SECONDS - 1);
    fake.advanceTime(10 * 60 * 1000);
    fake.gameOver(MEDIEVAL);

    assert.deepEqual(store.getPlayLogOf("guest", 2026), []);
    assert.equal(fake.files.fileExists(GUEST_LOG_2026), false);
    assert.equal(store.hasPlayed(MEDIEVAL.configId), false);
});

test("a Play counts for the Profile active at its start, and Guest keeps its own Play Log", () => {
    const fake = createFake();
    fake.addFolder(ALICE);
    const store = createProfileStore(fake);

    play(fake, MEDIEVAL, 90);
    store.switchTo("Alice");
    fake.gameStarted(MEDIEVAL);
    fake.advanceTime(120 * 1000);
    store.switchTo("guest");
    fake.gameOver(MEDIEVAL);

    assert.deepEqual(store.getPlayLogOf("guest", 2026), [
        { start: "2026-10-01T21:10:00", configId: MEDIEVAL.configId, seconds: 90 },
    ]);
    assert.deepEqual(store.getPlayLogOf("Alice", 2026), [
        { start: "2026-10-01T21:11:30", configId: MEDIEVAL.configId, seconds: 120 },
    ]);
    assert.ok(fake.files.fileExists(`${ALICE}\\play-log-2026.json`));
});

test("a game started on 31 December before midnight and ended after it is in the old year's file", () => {
    const fake = createFake(new Date(2026, 11, 31, 23, 58, 0));
    const store = createProfileStore(fake);

    play(fake, MEDIEVAL, 5 * 60);

    assert.deepEqual(store.getPlayLogOf("guest", 2026), [
        { start: "2026-12-31T23:58:00", configId: MEDIEVAL.configId, seconds: 300 },
    ]);
    assert.deepEqual(store.getPlayLogOf("guest", 2027), []);
    assert.equal(fake.files.fileExists(`${PROFILES}\\guest\\play-log-2027.json`), false);
});

test("a new Play is added after the Plays already in the year's file, through a backup", () => {
    const fake = createFake();
    const earlier = { start: "2026-09-30T20:00:00", configId: MEDIEVAL.configId, seconds: 600 };
    fake.addFile(GUEST_LOG_2026, playLogJson([earlier]));
    const store = createProfileStore(fake);

    play(fake, MEDIEVAL, 90);

    assert.deepEqual(store.getPlayLogOf("guest", 2026).map(entry => entry.start), ["2026-09-30T20:00:00", "2026-10-01T21:10:00"]);
    assert.deepEqual(JSON.parse(fake.readFile(`${PROFILES}\\guest\\play-log-2026.bak.json`)).plays, [earlier]);
    assert.equal(fake.files.fileExists(`${PROFILES}\\guest\\play-log-2026.tmp.json`), false);
});

test("a broken year file is restored from its backup before the Play is added", () => {
    const fake = createFake();
    const earlier = { start: "2026-09-30T20:00:00", configId: MEDIEVAL.configId, seconds: 600 };
    fake.addFile(GUEST_LOG_2026, "{ \"version\": 1, \"plays\": [");
    fake.addFile(`${PROFILES}\\guest\\play-log-2026.bak.json`, playLogJson([earlier]));
    const store = createProfileStore(fake);

    play(fake, MEDIEVAL, 90);

    assert.deepEqual(store.getPlayLogOf("guest", 2026).map(entry => entry.seconds), [600, 90]);
    assert.ok(loggedAbout(fake, /guest\\play-log-2026\.json.*restored from its backup/));
    // Set aside when the game ended, the first time the year file was read.
    assert.ok(fake.files.fileExists(`${PROFILES}\\guest\\play-log-2026.broken-2026-10-01_21-11-30.json`));
});

test("a year file broken along with its backup is set aside under dated names and the Play Log starts over", () => {
    const fake = createFake();
    fake.addFile(GUEST_LOG_2026, "not json");
    fake.addFile(`${PROFILES}\\guest\\play-log-2026.bak.json`, "[]");
    const store = createProfileStore(fake);

    play(fake, MEDIEVAL, 90);

    assert.deepEqual(store.getPlayLogOf("guest", 2026).map(entry => entry.seconds), [90]);
    assert.ok(loggedAbout(fake, /play-log-2026\.json and its backup are unreadable/));
    assert.ok(fake.files.fileExists(`${PROFILES}\\guest\\play-log-2026.broken-2026-10-01_21-11-30.json`));
    assert.ok(fake.files.fileExists(`${PROFILES}\\guest\\play-log-2026.bak.broken-2026-10-01_21-11-30.json`));
});

test("a year file without a list of Plays is set aside rather than overwritten", () => {
    const fake = createFake();
    fake.addFile(GUEST_LOG_2026, JSON.stringify({ version: 1, play: [] }));
    const store = createProfileStore(fake);

    play(fake, MEDIEVAL, 90);

    assert.deepEqual(store.getPlayLogOf("guest", 2026).map(entry => entry.seconds), [90]);
    assert.ok(loggedAbout(fake, /play-log-2026\.json has no "plays" list/));
    assert.equal(fake.readFile(`${PROFILES}\\guest\\play-log-2026.broken-2026-10-01_21-11-30.json`), JSON.stringify({ version: 1, play: [] }));
});

test("reading a year without any Play gives an empty list", () => {
    const fake = createFake();
    fake.addFolder(ALICE);
    const store = createProfileStore(fake);

    assert.deepEqual(store.getPlayLogOf("guest", 2025), []);
    assert.deepEqual(store.getPlayLogOf("Alice", 2026), []);
});
