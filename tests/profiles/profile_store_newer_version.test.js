// ============================================================
// Profile store at the host seam, after a return to an older commit: a
// cabinet.json, profile.json or Play Log year file of a newer version is set
// aside as "<name>.newer-<date>.json", logged, and never read or rewritten;
// its backup restores it only when that backup is not newer too (ADR 0016).
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import { createProfileStore } from "../../common/profiles/profile_store.js";

const NOW = new Date(2026, 8, 24, 21, 0, 0);
const DATE = "2026-09-24_21-00-00";
const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const ALICE = `${PROFILES}\\Alice`;
const CABINET_FILE = `${PROFILES}\\cabinet.json`;

const MEDIEVAL = { id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", isHidden: false };

function createFake() {
    return createFakePinballYHost({ now: NOW, tables: [MEDIEVAL] });
}

function play(fake, game, seconds) {
    fake.gameStarted(game);
    fake.advanceTime(seconds * 1000);
    fake.gameOver(game);
}

const cabinetJson = (version, activeProfile) => JSON.stringify({ version, activeProfile });
const profileJson = (version, count) => JSON.stringify({
    version, plays: { [MEDIEVAL.configId]: { count, seconds: count * 60, lastPlayed: "2026-09-20T20:00:00" } },
});
const playLogJson = (version, seconds) => JSON.stringify({
    version, plays: [{ start: "2026-09-20T20:00:00", configId: MEDIEVAL.configId, seconds }],
});
const readJson = (fake, path) => JSON.parse(fake.readFile(path));
const loggedAbout = (fake, pattern) => fake.logLines().some(line => line.startsWith("[ProfileStore]") && pattern.test(line));

// Alice active, as after a switch in an earlier session.
function seedActiveAlice(fake, { profile, backup }) {
    fake.addFolder(ALICE);
    if (profile !== undefined) fake.addFile(`${ALICE}\\profile.json`, profile);
    if (backup !== undefined) fake.addFile(`${ALICE}\\profile.bak.json`, backup);
    fake.addFile(CABINET_FILE, cabinetJson(1, "Alice"));
}

test("a newer cabinet.json without a backup is set aside untouched, logged, and Guest becomes active", () => {
    const fake = createFake();
    fake.addFolder(ALICE);
    const newer = cabinetJson(2, "Alice");
    fake.addFile(CABINET_FILE, newer);

    const store = createProfileStore(fake);

    assert.equal(store.getActiveProfile().name, "guest");
    assert.equal(fake.readFile(`${PROFILES}\\cabinet.newer-${DATE}.json`), newer);
    assert.deepEqual(readJson(fake, CABINET_FILE), { version: 1, activeProfile: "guest" });
    assert.ok(loggedAbout(fake, new RegExp(`cabinet\\.json.*version 2.*cabinet\\.newer-${DATE}\\.json`)));
});

test("a newer cabinet.json with an older backup is restored from that backup", () => {
    const fake = createFake();
    fake.addFolder(ALICE);
    fake.addFile(CABINET_FILE, cabinetJson(2, "guest"));
    fake.addFile(`${PROFILES}\\cabinet.bak.json`, cabinetJson(1, "Alice"));

    const store = createProfileStore(fake);

    assert.equal(store.getActiveProfile().name, "Alice");
    assert.equal(readJson(fake, `${PROFILES}\\cabinet.newer-${DATE}.json`).version, 2);
    assert.ok(loggedAbout(fake, /cabinet\.json.*restored from its backup/));
});

test("a newer profile.json with a newer backup sets both aside and the Profile starts from zero", () => {
    const fake = createFake();
    seedActiveAlice(fake, { profile: profileJson(3, 5), backup: profileJson(2, 4) });

    const store = createProfileStore(fake);

    assert.equal(store.getActiveProfile().name, "Alice");
    assert.equal(store.getPlay(MEDIEVAL.configId).count, 0);
    assert.equal(readJson(fake, `${ALICE}\\profile.newer-${DATE}.json`).version, 3);
    assert.equal(readJson(fake, `${ALICE}\\profile.bak.newer-${DATE}.json`).version, 2);
    assert.ok(loggedAbout(fake, /Alice\\profile\.bak\.json.*version 2/));
    assert.ok(loggedAbout(fake, /Alice\\profile\.json.*from zero/));

    play(fake, MEDIEVAL, 60);
    assert.equal(readJson(fake, `${ALICE}\\profile.json`).version, 1);
    assert.equal(readJson(fake, `${ALICE}\\profile.newer-${DATE}.json`).plays[MEDIEVAL.configId].count, 5);
});

test("a newer profile.json with a backup of the code's version, an older one or none is restored from that backup", () => {
    for (const backupVersion of [1, 0, undefined]) {
        const fake = createFake();
        seedActiveAlice(fake, { profile: profileJson(2, 5), backup: profileJson(backupVersion, 4) });

        const store = createProfileStore(fake);

        assert.equal(store.getPlay(MEDIEVAL.configId).count, 4, `backup version ${backupVersion}`);
        assert.equal(readJson(fake, `${ALICE}\\profile.newer-${DATE}.json`).plays[MEDIEVAL.configId].count, 5);
        assert.ok(loggedAbout(fake, /Alice\\profile\.json.*restored from its backup/));
    }
});

test("a profile.json of the code's version, an older one or one without a version loads as before", () => {
    for (const version of [1, 0, undefined]) {
        const fake = createFake();
        seedActiveAlice(fake, { profile: profileJson(version, 3) });

        const store = createProfileStore(fake);

        assert.equal(store.getPlay(MEDIEVAL.configId).count, 3, `version ${version}`);
        assert.deepEqual(fake.logLines(), [], `version ${version}`);
    }
});

test("a newer Play Log year file is set aside and never rewritten; the Play goes in a fresh one", () => {
    const fake = createFake();
    const yearFile = `${PROFILES}\\guest\\play-log-2026.json`;
    const newer = playLogJson(2, 600);
    fake.addFile(yearFile, newer);
    const store = createProfileStore(fake);

    play(fake, MEDIEVAL, 90);

    assert.deepEqual(store.getPlayLogOf("guest", 2026).map(entry => entry.seconds), [90]);
    // Set aside when the game ended, the first time the year file was read.
    assert.equal(fake.readFile(`${PROFILES}\\guest\\play-log-2026.newer-2026-09-24_21-01-30.json`), newer);
    assert.equal(fake.files.fileExists(`${PROFILES}\\guest\\play-log-2026.bak.json`), false);
    assert.ok(loggedAbout(fake, /guest\\play-log-2026\.json.*version 2/));
    assert.deepEqual(store.getPlayLogYearsOf("guest"), [2026]);
});

test("the set-aside name of a newer file is numbered when that name is taken", () => {
    const fake = createFake();
    const taken = `${PROFILES}\\cabinet.newer-${DATE}.json`;
    fake.addFile(taken, "kept by hand");
    fake.addFile(CABINET_FILE, cabinetJson(2, "guest"));

    createProfileStore(fake);

    assert.equal(fake.readFile(taken), "kept by hand");
    assert.equal(readJson(fake, `${PROFILES}\\cabinet.newer-${DATE}-2.json`).version, 2);
});
