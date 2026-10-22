// ============================================================
// Holiday Frames at the Profile Rewards seam, on the fake host's file
// system: which ones a Profile's Play Log unlocks (a Play starting or
// ending on the holiday, local time), the frames listed, the one worn.
// Never loaded by PinballY.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import { createProfileStore } from "../../common/profiles/profile_store.js";
import { createProfileRewards } from "../../common/avatar_frames/profile_rewards.js";

const NOW = new Date(2027, 0, 10, 12, 0, 0);
const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const GUEST = `${PROFILES}\\guest`;
const CONFIG_ID = "Medieval Madness (Williams 1997)";

// plays: { year: [[start, seconds], ...] } in the Guest's Play Log.
function rewardsWith(plays, { profileData = {}, isEnabled = () => true, withProfiles = true } = {}) {
    const fake = createFakePinballYHost({ now: NOW, tables: [] });
    fake.addFile(`${GUEST}\\profile.json`, JSON.stringify({ version: 1, plays: {}, notified: [], ...profileData }));
    for (const [year, yearPlays] of Object.entries(plays)) {
        fake.addFile(`${GUEST}\\play-log-${year}.json`, JSON.stringify({
            version: 1, plays: yearPlays.map(([start, seconds]) => ({ start, configId: CONFIG_ID, seconds })),
        }));
    }
    const profileStore = createProfileStore(fake);
    const wheelDialogs = { submit() {}, wake() {} };
    return { fake, profileStore, rewards: createProfileRewards(fake, { profileStore, isEnabled, withProfiles: () => withProfiles, wheelDialogs }) };
}

const unlockedHolidays = rewards => rewards.framesOf()
    .filter(frame => frame.family === "holiday" && frame.isUnlocked).map(frame => frame.id);

test("a Play starting on 24 or on 25 December unlocks Christmas", () => {
    assert.deepEqual(unlockedHolidays(rewardsWith({ 2026: [["2026-12-24T20:00:00", 600]] }).rewards), ["christmas"]);
    assert.deepEqual(unlockedHolidays(rewardsWith({ 2026: [["2026-12-25T09:30:00", 60]] }).rewards), ["christmas"]);
});

test("a Play from 23 December ending on the 24th unlocks Christmas; one ending just before midnight does not", () => {
    assert.deepEqual(unlockedHolidays(rewardsWith({ 2026: [["2026-12-23T23:50:00", 20 * 60]] }).rewards), ["christmas"]);
    assert.deepEqual(unlockedHolidays(rewardsWith({ 2026: [["2026-12-23T23:00:00", 59 * 60 + 59]] }).rewards), []);
    assert.deepEqual(unlockedHolidays(rewardsWith({ 2026: [["2026-12-26T00:00:00", 600]] }).rewards), []);
});

test("a Play from 31 December 23:50 to 1 January 00:10 unlocks New Year's Day; one on 31 December or 2 January does not", () => {
    assert.deepEqual(unlockedHolidays(rewardsWith({ 2026: [["2026-12-31T23:50:00", 20 * 60]] }).rewards), ["newYear"]);
    assert.deepEqual(unlockedHolidays(rewardsWith({ 2026: [["2026-12-31T15:00:00", 600]] }).rewards), []);
    assert.deepEqual(unlockedHolidays(rewardsWith({ 2027: [["2027-01-01T15:00:00", 600]] }).rewards), ["newYear"]);
    assert.deepEqual(unlockedHolidays(rewardsWith({ 2027: [["2027-01-02T00:00:00", 600]] }).rewards), []);
});

test("a game under one minute on Christmas Day is not a Play and unlocks nothing", () => {
    const { fake, profileStore, rewards } = rewardsWith({});
    fake.setNow(new Date(2026, 11, 25, 15, 0, 0));
    const game = { configId: CONFIG_ID };
    fake.gameStarted(game);
    fake.advanceTime(59 * 1000);
    fake.gameOver(game);
    assert.deepEqual(unlockedHolidays(rewards), []);

    fake.gameStarted(game);
    fake.advanceTime(60 * 1000);
    fake.gameOver(game);
    assert.deepEqual(profileStore.getPlayLogYearsOf("guest"), [2026]);
    assert.deepEqual(unlockedHolidays(rewards), ["christmas"], "read again after the Play");
});

test("Plays of every year file count, and the Holiday Frames are listed after the Collection Tiers in the year's order", () => {
    const { rewards } = rewardsWith({ 2026: [["2026-10-01T20:00:00", 600]], 2027: [["2027-12-24T21:00:00", 600]] }, { profileData: { collectionTier: 2 } });
    const frames = rewards.framesOf();
    assert.deepEqual(frames.map(frame => [frame.id, frame.family, frame.isUnlocked]), [
        [1, "collection", true], [2, "collection", true], [3, "collection", false], [4, "collection", false], [5, "collection", false],
        [6, "collection", false], [7, "collection", false], [8, "collection", false], [9, "collection", false], [10, "collection", false],
        ["newYear", "holiday", false], ["valentine", "holiday", false], ["stPatrick", "holiday", false], ["musicDay", "holiday", false],
        ["halloween", "holiday", false], ["deadDay", "holiday", false], ["christmas", "holiday", true],
    ]);
    assert.equal(frames[16].name, "Christmas");
    assert.equal(frames[16].holiday, "christmas");
    assert.equal(frames[15].unlockCondition, "A Play on 1 or 2 November", "a locked row tells what wins it");
});

test("each fixed-date holiday unlocks on its own day, not the day before or after", () => {
    const cases = [
        ["valentine", "2027-02-14", "2027-02-13", "2027-02-15"],
        ["stPatrick", "2027-03-17", "2027-03-16", "2027-03-18"],
        ["musicDay", "2027-06-21", "2027-06-20", "2027-06-22"],
        ["halloween", "2026-10-31", "2026-10-30", null],
        ["deadDay", "2026-11-02", null, "2026-11-03"],
    ];
    for (const [id, day, before, after] of cases) {
        assert.deepEqual(unlockedHolidays(rewardsWith({ [day.slice(0, 4)]: [[`${day}T12:00:00`, 600]] }).rewards), [id], day);
        for (const other of [before, after].filter(Boolean)) {
            assert.deepEqual(unlockedHolidays(rewardsWith({ [other.slice(0, 4)]: [[`${other}T12:00:00`, 600]] }).rewards), [], other);
        }
    }
});

test("one Play from 31 October 23:50 to 1 November 00:10 unlocks Halloween and Día de los Muertos", () => {
    assert.deepEqual(unlockedHolidays(rewardsWith({ 2026: [["2026-10-31T23:50:00", 20 * 60]] }).rewards), ["halloween", "deadDay"]);
});

test("Christmas stays with Table Mastery off, which has no Collection frames, and goes without the Profile picker", () => {
    const plays = { 2026: [["2026-12-24T20:00:00", 600]] };
    assert.deepEqual(rewardsWith(plays, { profileData: { collectionTier: 3 }, isEnabled: () => false }).rewards.framesOf()
        .filter(frame => frame.isUnlocked).map(frame => frame.id), ["christmas"]);
    assert.deepEqual(rewardsWith(plays, { profileData: { collectionTier: 3 }, withProfiles: false }).rewards.framesOf().map(frame => frame.id),
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.deepEqual(rewardsWith(plays, { isEnabled: () => false, withProfiles: false }).rewards.framesOf(), []);
});

test("choosing Christmas saves its text id and wears it; a Profile Reset takes it back and the Profile wears none", () => {
    const { fake, profileStore, rewards } = rewardsWith({ 2026: [["2026-12-25T20:00:00", 600]] });
    assert.equal(rewards.choose("christmas"), true);
    assert.equal(JSON.parse(fake.readFile(`${GUEST}\\profile.json`)).avatarFrame, "christmas");
    assert.equal(rewards.wornFrameOf().id, "christmas");

    profileStore.resetProfile("guest");
    assert.deepEqual(unlockedHolidays(rewards), []);
    assert.equal(rewards.wornFrameOf(), null);
    assert.equal(rewards.choose("christmas"), false, "locked again");
});

test("the Christmas toast goes stale on a Profile Reset or when another Profile is active", () => {
    const { fake, profileStore, rewards } = rewardsWith({ 2026: [["2026-10-01T20:00:00", 600]] }, { profileData: { avatarFrame: null } });
    fake.addFolder(`${PROFILES}\\Alice`);
    const submitted = [];
    rewards.enablePrompts(() => {}, { submit: toast => submitted.push(toast) });
    const game = { configId: CONFIG_ID };
    const playOnChristmas = () => {
        fake.setNow(new Date(2026, 11, 25, 20, 0, 0));
        fake.gameStarted(game);
        fake.advanceTime(10 * 60 * 1000);
        fake.gameOver(game);
    };

    playOnChristmas();
    assert.deepEqual(submitted.map(toast => [toast.kind, toast.title, toast.isStale()]), [["frame", "New frame: Christmas", false]]);
    profileStore.switchTo("Alice");
    assert.equal(submitted[0].isStale(), true, "another Profile active");
    profileStore.switchTo("guest");
    assert.equal(submitted[0].isStale(), false);
    profileStore.resetProfile("guest");
    assert.equal(submitted[0].isStale(), true, "reset");

    playOnChristmas();
    assert.equal(submitted.length, 2, "won again after the reset");
});

test("an unknown avatarFrame id, or a holiday not won, wears none without error", () => {
    const { fake, rewards } = rewardsWith({}, { profileData: { avatarFrame: "diwali" } });
    assert.equal(rewards.wornFrameOf(), null);
    assert.equal(rewards.wornImageOf("guest", 192), null);
    assert.equal(rewardsWith({}, { profileData: { avatarFrame: "christmas" } }).rewards.wornFrameOf(), null);
    assert.equal(rewards.choose("diwali"), false);
    assert.deepEqual(fake.logLines(), []);
});
