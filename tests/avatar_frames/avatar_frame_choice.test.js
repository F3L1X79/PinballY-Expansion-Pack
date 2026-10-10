// ============================================================
// Choosing an Avatar Frame in the Profile Stats' list, through main.js on
// the fake PinballY globals: Select on a locked row stays; on an unlocked
// row or "None" it saves the choice in profile.json ("avatarFrame") and
// goes back to the Profile Stats on the Frame button, as Exit does
// without a change; the list then opens on the worn row.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines, profileFile, DRAWN_AHEAD_MS } from "../mastery/mastery_bar_scenario.js";
import {
    openProfileStats, choose, highlighted, press, isProfileStatsOpen, isFrameListOpen, frameRows, highlightedRow, pickRow, PROFILE_STATS_OPEN_MS,
} from "../stats/profile_stats_reader.js";

const ADD_ONS = ["tableMastery", "achievements", "customMenuCommands"];
const savedData = (fake, name) => JSON.parse(fake.readFile(profileFile(name)));
const wornRow = fake => frameRows(fake).find(row => row.status === "Worn").name;

test("Select saves an unlocked frame and goes back on the Frame button; a locked row stays; Exit changes nothing", async () => {
    const fake = await startScenario({ addOns: ADD_ONS, frameImages: true, profiles: { guest: { collectionTier: 3, avatarFrame: null } } });
    fake.advanceTime(DRAWN_AHEAD_MS);
    const { default: lang } = await import("../../common/i18n.js");
    openProfileStats(fake, lang);
    choose(fake, "Frame");

    pickRow(fake, "Eternal Frost");
    assert.equal(isFrameListOpen(fake), true, "a locked frame is not chosen");
    assert.equal(savedData(fake, "guest").avatarFrame, null);

    pickRow(fake, "Steam and Gears");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.equal(isFrameListOpen(fake), false);
    assert.equal(isProfileStatsOpen(fake), true);
    assert.equal(highlighted(fake), "Frame", "back on the Frame button");
    assert.equal(savedData(fake, "guest").avatarFrame, 2);

    choose(fake, "Frame");
    assert.equal(wornRow(fake), "Steam and Gears");
    assert.equal(highlightedRow(fake), "Steam and Gears", "the list opens on the worn row");
    assert.deepEqual(frameRows(fake).find(row => row.name === "None").status, null);

    press(fake, "Next");
    press(fake, "Exit");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.equal(highlighted(fake), "Frame", "Exit goes back on the Frame button too");
    assert.equal(savedData(fake, "guest").avatarFrame, 2, "Exit changes nothing");

    choose(fake, "Frame");
    pickRow(fake, "None");
    assert.equal(savedData(fake, "guest").avatarFrame, null, "None is recorded as null");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    choose(fake, "Frame");
    assert.equal(wornRow(fake), "None");
    assert.deepEqual(errorLines(fake), []);
});
