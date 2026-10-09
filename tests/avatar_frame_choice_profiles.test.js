// ============================================================
// Avatar Frame choices by Profile, through main.js on the fake PinballY
// globals: a Child Profile chooses like any Profile, each choice stays in
// its own profile.json, and a Profile Reset drops it, the list then
// showing "None" as worn.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines, profileFile, DRAWN_AHEAD_MS } from "./mastery_bar_scenario.js";
import { openProfileStats, choose, frameRows, pickRow, press, PROFILE_STATS_OPEN_MS } from "./profile_stats_reader.js";
import { getProfileStore } from "../common/profile_store.js";

const ADD_ONS = ["tableMastery", "achievements", "customMenuCommands", "profilePicker"];
const savedData = (fake, name) => JSON.parse(fake.readFile(profileFile(name)));
const wornRow = fake => frameRows(fake).find(row => row.status === "Worn").name;

test("a Child Profile's choice stays in its own profile.json, and a Profile Reset clears Guest's", async () => {
    const fake = await startScenario({
        addOns: ADD_ONS, frameImages: true, active: "mia",
        profiles: { guest: { collectionTier: 3, avatarFrame: 2 }, mia: { collectionTier: 2, isChild: true } },
    });
    fake.advanceTime(DRAWN_AHEAD_MS);
    const { default: lang } = await import("../common/i18n.js");

    openProfileStats(fake, lang);
    choose(fake, "Frame");
    pickRow(fake, "Enchanted Forest");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    press(fake, "Exit");
    assert.equal(savedData(fake, "mia").avatarFrame, 1);
    assert.equal(savedData(fake, "guest").avatarFrame, 2, "another Profile's choice is left alone");

    getProfileStore().switchTo("guest");
    fake.advanceTime(DRAWN_AHEAD_MS);
    openProfileStats(fake, lang);
    choose(fake, "Frame");
    assert.equal(wornRow(fake), "Steam and Gears");
    press(fake, "Exit");
    press(fake, "Exit");

    getProfileStore().resetProfile("guest");
    fake.advanceTime(DRAWN_AHEAD_MS);
    assert.equal("avatarFrame" in savedData(fake, "guest"), false);
    openProfileStats(fake, lang);
    choose(fake, "Frame");
    assert.equal(wornRow(fake), "None");
    assert.equal(savedData(fake, "mia").avatarFrame, 1);
    assert.deepEqual(errorLines(fake), []);
});
