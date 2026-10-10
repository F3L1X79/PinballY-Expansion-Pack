// ============================================================
// Challenge Tables, through the Challenge module and the Challenge Tables
// filter on the fake PinballY host, with a real Profile store, real Period
// Tables and a real Random Game module: the filter sits in the main menu
// right under "All Tables", and choosing it puts on the wheel the visible
// tables that would move the Challenge forward, or every table back when
// there is none (other templates, not followed yet, no Challenge, completed).
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import { createProfileStore } from "../../common/profile_store.js";
import { createPeriodTable, TABLE_OF_THE_DAY, TABLE_OF_THE_WEEK } from "../../common/period_table.js";
import { createRandomGame } from "../../common/random_game.js";
import { createChallenges } from "../../common/challenge.js";
import { createChallengeTables } from "../../common/challenge_tables.js";
import { createAchievementToasts } from "../../common/achievement_toast.js";

// Monday 21 September 2026, 20:00; its week is keyed "2026-09-21".
const MONDAY = new Date(2026, 8, 21, 20, 0, 0);
const TUESDAY = new Date(2026, 8, 22, 20, 0, 0);
const WEEK = "2026-09-21";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const FILTER_ID = "User.project.ChallengeTables";

const table = (id, manufacturer, year, isHidden = false) =>
    ({ id, configId: `Table ${id}`, title: `Table ${id}`, manufacturer, year, isHidden });
// Tables 1 to 6, the 4th hidden.
const TABLES = [
    table(1, "Stern", 2016), table(2, "Stern", 2020), table(3, "Williams", 1992),
    table(4, "Stern", 2021, true), table(5, "Stern", 1995), table(6, "Bally", 1993),
];
const played = lastPlayed => ({ count: 1, seconds: 600, lastPlayed });
const RECENTLY = played("2026-09-13T20:00:00");
// More than six months before MONDAY.
const LONG_AGO = played("2026-03-21T20:00:00");

const challengeOf = (template, param = null, target = 3) => ({ week: WEEK, template, param, target });

// challenge: the week's Challenge, already locked in cabinet.json and
// followed by Alice; plays: Alice's play records. Bob has never shown up
// to follow it.
function setUp({ challenge, active = "Alice", plays = {}, now = MONDAY } = {}) {
    const fake = createFakePinballYHost({ now, tables: TABLES });
    fake.installGlobals();
    fake.addFolder(`${PROFILES}\\Alice`);
    fake.addFolder(`${PROFILES}\\Bob`);
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({
        plays,
        challenge: { firstWeek: WEEK, week: WEEK, games: [], completed: false, completedCount: 0, judgedWeek: "", history: [] },
    }));
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({
        version: 1, activeProfile: active, challenge: challenge && { current: challenge, previous: null },
    }));
    const store = createProfileStore(fake);
    const tableOfTheDay = createPeriodTable(fake, TABLE_OF_THE_DAY, store);
    const tableOfTheWeek = createPeriodTable(fake, TABLE_OF_THE_WEEK, store);
    const randomGame = createRandomGame(fake, store, { animateTo: async () => {}, skipAnimation: true });
    const challenges = createChallenges(fake, store,
        { tableOfTheDay, tableOfTheWeek, randomGame, toasts: createAchievementToasts(fake) });
    createChallengeTables(fake, challenges);
    return { fake, store, tableOfTheDay, tableOfTheWeek };
}

// Chooses the filter, then the menu closes; the wheel's tables.
function chooseFilter(fake) {
    fake.setCurrentFilter(FILTER_ID);
    fake.fire("wheelmode");
    return fake.getWheelTables().map(game => game.configId);
}
// Nothing to play: choosing the filter brings every table back.
const offersNothing = fake => {
    chooseFilter(fake);
    return fake.currentFilterId() === "All";
};

function play(fake, game, seconds = 90) {
    fake.gameStarted(game);
    fake.advanceTime(seconds * 1000);
    fake.gameOver(game);
}

test("manufacturerTables: the manufacturer's visible tables, leaving out those already counted", async () => {
    const { fake } = setUp({ challenge: challengeOf("manufacturerTables", "Stern") });

    assert.ok(!offersNothing(fake));
    assert.deepEqual(chooseFilter(fake), ["Table 1", "Table 2", "Table 5"]);

    play(fake, TABLES[1]);
    play(fake, TABLES[2]);
    assert.deepEqual(chooseFilter(fake), ["Table 1", "Table 5"]);
});

test("decadeTables: the decade's visible tables, leaving out those already counted", async () => {
    const { fake } = setUp({ challenge: challengeOf("decadeTables", 1990) });

    assert.deepEqual(chooseFilter(fake), ["Table 3", "Table 5", "Table 6"]);

    play(fake, TABLES[4]);
    assert.deepEqual(chooseFilter(fake), ["Table 3", "Table 6"], "chosen again while already on the wheel");
});

test("neverPlayedTables: the visible tables the Profile never played", async () => {
    const { fake } = setUp({ challenge: challengeOf("neverPlayedTables"), plays: { "Table 1": RECENTLY, "Table 3": LONG_AGO } });

    assert.deepEqual(chooseFilter(fake), ["Table 2", "Table 5", "Table 6"]);

    play(fake, TABLES[5]);
    assert.deepEqual(chooseFilter(fake), ["Table 2", "Table 5"]);
});

test("dustyTables: the visible tables the Profile last played more than six months ago", async () => {
    const { fake } = setUp({
        challenge: challengeOf("dustyTables"),
        plays: { "Table 1": RECENTLY, "Table 2": LONG_AGO, "Table 3": LONG_AGO, "Table 4": LONG_AGO },
    });

    assert.deepEqual(chooseFilter(fake), ["Table 2", "Table 3"]);

    play(fake, TABLES[1]);
    assert.deepEqual(chooseFilter(fake), ["Table 3"]);
});

test("tableOfTheDayDays: the Table of the Day, until it counted today", async () => {
    const { fake, tableOfTheDay } = setUp({ challenge: challengeOf("tableOfTheDayDays") });
    const mondayTable = tableOfTheDay.getTable();

    assert.deepEqual(chooseFilter(fake), [mondayTable.configId]);

    play(fake, mondayTable);
    assert.ok(offersNothing(fake), "today already counted");

    fake.setNow(TUESDAY);
    fake.fire("wheelmode");
    assert.deepEqual(chooseFilter(fake), [tableOfTheDay.getTable().configId]);
});

test("tableOfTheWeekGames: the Table of the Week, even once played", async () => {
    const { fake, tableOfTheWeek } = setUp({ challenge: challengeOf("tableOfTheWeekGames") });
    const weekTable = tableOfTheWeek.getTable();

    assert.deepEqual(chooseFilter(fake), [weekTable.configId]);
    play(fake, weekTable);
    assert.deepEqual(chooseFilter(fake), [weekTable.configId]);
});

test("the other templates offer no table", () => {
    for (const template of ["differentTables", "differentManufacturers", "differentDecades", "activeDays",
        "endurance", "marathon", "randomGames", "sameTableGames"]) {
        const { fake } = setUp({ challenge: challengeOf(template) });
        assert.ok(offersNothing(fake), template);
    }
});

test("a Challenge not followed yet, no Challenge and a completed Challenge offer no table", () => {
    assert.ok(offersNothing(setUp({ challenge: challengeOf("manufacturerTables", "Stern"), active: "Bob" }).fake), "not followed");
    assert.ok(offersNothing(setUp({ challenge: { week: WEEK, template: "", param: null, target: 0 } }).fake), "no Challenge");

    const { fake } = setUp({ challenge: challengeOf("manufacturerTables", "Stern", 2) });
    play(fake, TABLES[0]);
    assert.ok(!offersNothing(fake));
    play(fake, TABLES[1]);
    assert.ok(offersNothing(fake), "completed");
});

// PinballY's "All Tables" has sort key "3000", the Hall of Fame "6000" and
// "Favorites" "7000" in the [Top] group.
test("the Challenge Tables filter sits in the main menu right under All Tables", () => {
    const { fake } = setUp({ challenge: challengeOf("manufacturerTables", "Stern") });

    assert.equal(fake.scriptFilters().length, 1);
    const [filter] = fake.scriptFilters();
    assert.equal(filter.group, "[Top]");
    assert.ok(filter.sortKey > "3000" && filter.sortKey < "6000", filter.sortKey);
});

// Back on the wheel with the Challenge Tables shown: the list is selected
// again, or every table comes back once it is empty.
const onChallengeTables = fake => fake.currentFilterId() === "User.project.ChallengeTables";

test("back on the wheel, the Challenge Tables shown leave out a table that just counted", async () => {
    const { fake } = setUp({ challenge: challengeOf("manufacturerTables", "Stern") });
    chooseFilter(fake);

    play(fake, TABLES[1]);

    assert.ok(onChallengeTables(fake));
    assert.deepEqual(fake.getWheelTables().map(game => game.configId), ["Table 1", "Table 5"]);
});

test("once the Challenge is completed, the wheel goes back to every table", async () => {
    const { fake } = setUp({ challenge: challengeOf("manufacturerTables", "Stern", 2) });
    chooseFilter(fake);

    play(fake, TABLES[0]);
    play(fake, TABLES[1]);

    assert.equal(fake.currentFilterId(), "All");
    assert.deepEqual(fake.getWheelTables().map(game => game.configId).sort(),
        ["Table 1", "Table 2", "Table 3", "Table 5", "Table 6"]);
});

test("once the Table of the Day counted today, the wheel goes back to every table", async () => {
    const { fake, tableOfTheDay } = setUp({ challenge: challengeOf("tableOfTheDayDays") });
    chooseFilter(fake);

    play(fake, tableOfTheDay.getTable());

    assert.equal(fake.currentFilterId(), "All");
});

test("after a switch to a Profile not following the Challenge yet, the wheel goes back to every table", async () => {
    const { fake, store } = setUp({ challenge: challengeOf("manufacturerTables", "Stern") });
    chooseFilter(fake);

    store.switchTo("Bob");
    fake.fire("wheelmode");

    assert.equal(fake.currentFilterId(), "All");
});

test("another filter shown is left alone", async () => {
    const { fake } = setUp({ challenge: challengeOf("manufacturerTables", "Stern", 2) });
    fake.setWheelTables(["Table 3"], { filterId: "Favorites" });

    play(fake, TABLES[0]);
    play(fake, TABLES[1]);

    assert.equal(fake.currentFilterId(), "Favorites");
});
