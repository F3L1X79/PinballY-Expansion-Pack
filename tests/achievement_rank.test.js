// ============================================================
// Achievement Rank of every Achievement, through main.js on the fake
// PinballY globals: a ladder's steps go from Bronze to Platinum, a
// standalone Achievement is Gold unless it states its rank, and a group
// completion takes its rank from the size of its group.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { ACHIEVEMENT_RANK } from "../common/achievements.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const ADD_ONS_UNDER_TEST = ["customMenuCommands", "sessionStatsTracker", "achievements", "challenges", "profilePicker"];

// One manufacturer, decade and category per group size.
const GROUP_SIZES = [
    { manufacturer: "Stern", year: 2015, category: "Modern", count: 2 },
    { manufacturer: "Williams", year: 1995, category: "Classic", count: 8 },
    { manufacturer: "Bally", year: 1985, category: "SolidState", count: 20 },
    { manufacturer: "Gottlieb", year: 1965, category: "EM", count: 40 },
];
const TABLES = GROUP_SIZES.flatMap(({ manufacturer, year, category, count }) =>
    Array.from({ length: count }, (_, index) => {
        const title = `${manufacturer} ${index + 1}`;
        return {
            id: `${manufacturer}${index}`, configId: title, title, manufacturer, year, categories: [category],
            playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false,
        };
    }));

const { BRONZE, SILVER, GOLD, PLATINUM } = ACHIEVEMENT_RANK;

test("every Achievement has an Achievement Rank deduced from its ladder or group", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 10, 0, 0), tables: TABLES });
    fake.addFolder(`${PROFILES_FOLDER}\\Alice`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";

    await import("../main.js");
    await settle();
    const { getAllAchievements } = await import("../addons/achievements_engine.js");

    const achievements = getAllAchievements();
    const rankById = new Map(achievements.map(achievement => [achievement.id, achievement.rank]));
    const ranksOf = ids => ids.map(id => rankById.get(id));

    for (const { id, rank } of achievements) {
        assert.ok(Object.values(ACHIEVEMENT_RANK).includes(rank), `${id} has no Achievement Rank`);
    }
    // Every family is there.
    assert.ok(rankById.has("challengesCompleted:1"));
    assert.ok(rankById.has("randomGames:10"));

    assert.deepEqual(ranksOf(["playTimeMilestone:1h", "playTimeMilestone:5h", "playTimeMilestone:10h",
        "playTimeMilestone:50h", "playTimeMilestone:100h"]), [BRONZE, SILVER, GOLD, GOLD, PLATINUM]);
    assert.deepEqual(ranksOf(["marathon:30", "marathon:60"]), [BRONZE, PLATINUM]);
    assert.deepEqual(ranksOf(["dayManufacturers:3", "dayManufacturers:5", "dayManufacturers:8", "dayManufacturers:10"]),
        [BRONZE, SILVER, GOLD, PLATINUM]);
    assert.deepEqual(ranksOf(["collectionMilestone:firstTable", "collectionMilestone:10percent",
        "collectionMilestone:25percent", "collectionMilestone:50percent", "collectionMilestone:75percent",
        "collectionMilestone:100percent"]), [BRONZE, SILVER, SILVER, GOLD, GOLD, PLATINUM]);
    // Each Period Tables series is its own ladder.
    assert.deepEqual(ranksOf(["tableOfTheDayPeriodsPlayed:10", "tableOfTheDayPeriodsPlayed:25",
        "tableOfTheDayPeriodsPlayed:50", "tableOfTheDayPeriodsPlayed:100"]), [BRONZE, SILVER, GOLD, PLATINUM]);
    assert.deepEqual(ranksOf(["tableOfTheWeekStreak:4", "tableOfTheWeekStreak:12"]), [BRONZE, PLATINUM]);
    assert.deepEqual(ranksOf(["challengesCompleted:1", "challengesCompleted:100"]), [BRONZE, PLATINUM]);

    // Secret Achievements take the rank of how hard they are, like any other.
    assert.deepEqual(ranksOf(["rageQuit", "grandReturn", "worldTour"]), [BRONZE, SILVER, SILVER]);
    assert.deepEqual(ranksOf(["nightOwl", "fridayThe13th", "fourSeasons", "lunchBreak", "mirrorHour"]),
        [GOLD, PLATINUM, GOLD, SILVER, SILVER]);
    // A Period Table's first play is the easiest step of its family.
    assert.deepEqual(ranksOf(["tableOfTheDayFirstPlay", "tableOfTheWeekFirstPlay"]), [BRONZE, BRONZE]);

    const EXPECTED_GROUP_RANKS = [BRONZE, SILVER, GOLD, PLATINUM];
    assert.deepEqual(ranksOf(GROUP_SIZES.map(group => `manufacturerCompletion:${group.manufacturer}`)), EXPECTED_GROUP_RANKS);
    assert.deepEqual(ranksOf(GROUP_SIZES.map(group => `decadeCompletion:${Math.floor(group.year / 10) * 10}s`)), EXPECTED_GROUP_RANKS);
    assert.deepEqual(ranksOf(GROUP_SIZES.map(group => `categoryCompletion:${group.category}`)), EXPECTED_GROUP_RANKS);

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
