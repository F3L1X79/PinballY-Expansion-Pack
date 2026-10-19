// ============================================================
// Pinning test of the Young Players family: its flags in the Profile's
// "surprises" part and its Achievement IDs. These strings are players'
// saved progress: this test must keep passing unchanged. In a file of its
// own: it installs the fake PinballY globals, which the other pinning tests
// already gave to main.js.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import { createProfileStore } from "../../common/profiles/profile_store.js";
import { buildYoungPlayersAchievements } from "../../achievements/young_players.js";
import { createSurprises } from "../../common/achievements/surprises.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const KID_PROFILE_FILE = `${PROFILES}\\Kid\\profile.json`;
const TABLE = {
    id: 1, configId: "Homebrew Table", title: "Homebrew Table", manufacturer: "", year: 0, categories: [],
    playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false,
};

test("the Young Players family keeps its flags in the surprises part and its Achievement IDs", () => {
    // Monday 5 October 2026, 16:30: Snack Time, then Wednesday Off below.
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 5, 16, 30, 0), tables: [TABLE] });
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Kid" }));
    fake.addFile(KID_PROFILE_FILE, JSON.stringify({ version: 1, isChild: true }));
    // Never uninstalled: buildYoungPlayersAchievements reads the shared Profile store.
    fake.installGlobals();
    const store = createProfileStore(fake);
    createSurprises(fake, store);
    fake.gameStarted(TABLE);
    fake.advanceTime(5 * 60 * 1000);
    fake.gameOver(TABLE);
    // Wednesday 7 October 2026, 13:00: Wednesday Off.
    fake.advanceTime(new Date(2026, 9, 7, 13, 0, 0) - fake.now());
    fake.gameStarted(TABLE);
    fake.advanceTime(5 * 60 * 1000);
    fake.gameOver(TABLE);

    const surprises = JSON.parse(fake.readFile(KID_PROFILE_FILE)).surprises;
    assert.equal(surprises.snackTime, true);
    assert.equal(surprises.wednesdayOff, true);
    // Each pinned ID is still built; a new Young Players Achievement only adds one.
    const ids = buildYoungPlayersAchievements({ profileName: "Kid" }).map(achievement => achievement.id);
    for (const id of ["snackTime", "wednesdayOff"]) assert.ok(ids.includes(id), `${id} is still a Young Players Achievement ID`);
});
