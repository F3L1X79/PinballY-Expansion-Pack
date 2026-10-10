// ============================================================
// Table of the Week behaviour, through the Period Table module's interface
// with the fake PinballY host and the Profile store: the table is kept from
// Monday to Sunday (locked in cabinet.json), replaced after the
// Sunday-to-Monday rollover, and the active Profile's week Streak counts
// once per week through a Play of the Table of the Week.
// Run with "node --test" from the project folder.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import { createPeriodTable, TABLE_OF_THE_WEEK } from "../../common/period_table.js";
import { createProfileStore } from "../../common/profile_store.js";

// Monday 21 September 2026, 00:00:01 local time.
const MONDAY = new Date(2026, 8, 21, 0, 0, 1);
const SUNDAY_NIGHT = new Date(2026, 8, 27, 23, 59, 59);
const NEXT_MONDAY = new Date(2026, 8, 28, 0, 0, 1);
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

const TABLES = [
    { id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", lastPlayed: new Date(2025, 0, 1) },
    { id: 2, configId: "Attack from Mars (Bally 1995)", title: "Attack from Mars", lastPlayed: new Date(2026, 5, 1) },
    { id: 3, configId: "Theatre of Magic (Bally 1995)", title: "Theatre of Magic", lastPlayed: null },
];

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const CABINET_FILE = `${PROFILES}\\cabinet.json`;
const GUEST_FILE = `${PROFILES}\\guest\\profile.json`;
const readJson = (fake, path) => JSON.parse(fake.readFile(path));

// lock: the Table of the Week stored in cabinet.json; streak: Guest's week
// Streak stored in its profile.json.
function createTableOfTheWeek({ now = MONDAY, tables = TABLES, lock, streak } = {}) {
    const fake = createFakePinballYHost({ now, tables });
    if (lock) {
        fake.addFile(CABINET_FILE, JSON.stringify({ version: 1, activeProfile: "guest", tableOfTheWeek: lock }));
    }
    if (streak) fake.addFile(GUEST_FILE, JSON.stringify({ version: 1, streaks: { tableOfTheWeek: streak } }));
    return { fake, tableOfTheWeek: createPeriodTable(fake, TABLE_OF_THE_WEEK, createProfileStore(fake)) };
}

// A game of the given length; a Play from a minute on.
function playFor(fake, game, seconds = 60) {
    fake.gameStarted(game);
    fake.advanceTime(seconds * 1000);
    fake.gameOver(game);
}
const playLastLaunch = (fake, seconds) => playFor(fake, fake.launches().at(-1), seconds);

test("keeps the same Table of the Week from Monday to Sunday", () => {
    const { fake, tableOfTheWeek } = createTableOfTheWeek();

    const mondayTable = tableOfTheWeek.getTable();
    fake.setNow(SUNDAY_NIGHT);

    assert.ok(mondayTable);
    assert.equal(tableOfTheWeek.getTable().configId, mondayTable.configId);
});

test("picks a new Table of the Week after the Sunday-to-Monday rollover, never the previous week's table", () => {
    const twoTables = TABLES.slice(0, 2);
    for (const lastWeekTable of twoTables) {
        const { fake, tableOfTheWeek } = createTableOfTheWeek({
            now: SUNDAY_NIGHT,
            tables: twoTables,
            lock: { configId: lastWeekTable.configId, period: "2026-09-14" },
        });

        const thisWeekTable = tableOfTheWeek.getTable();
        assert.notEqual(thisWeekTable.configId, lastWeekTable.configId);

        fake.setNow(NEXT_MONDAY);
        assert.equal(tableOfTheWeek.getTable().configId, lastWeekTable.configId);
    }
});

test("offers the previous week's table again when it is the only visible table, and counts it in the Streak", () => {
    const onlyTable = TABLES[0];
    const { fake, tableOfTheWeek } = createTableOfTheWeek({
        tables: [onlyTable],
        lock: { configId: onlyTable.configId, period: "2026-09-14" },
        streak: { current: 1, longest: 1, lastPeriod: "2026-09-14", periodsPlayed: 1 },
    });

    tableOfTheWeek.launch();
    playLastLaunch(fake);

    assert.deepEqual(fake.launches().map(game => game.configId), [onlyTable.configId]);
    assert.equal(tableOfTheWeek.getStreak(), 2);
});

test("keeps a Table of the Week stored earlier this week", () => {
    const { tableOfTheWeek } = createTableOfTheWeek({
        now: SUNDAY_NIGHT,
        lock: { configId: "Attack from Mars (Bally 1995)", period: "2026-09-21" },
    });

    assert.equal(tableOfTheWeek.getTable().configId, "Attack from Mars (Bally 1995)");
});

test("never picks a hidden table as the Table of the Week", () => {
    const hiddenTable = { id: 9, configId: "Hidden Table (Gottlieb 1978)", title: "Hidden Table", lastPlayed: null, isHidden: true };
    const { tableOfTheWeek } = createTableOfTheWeek({ tables: [hiddenTable, TABLES[1]] });

    assert.equal(tableOfTheWeek.getTable().configId, TABLES[1].configId);
});

test("launches the Table of the Week", () => {
    const { fake, tableOfTheWeek } = createTableOfTheWeek();

    tableOfTheWeek.launch();

    assert.deepEqual(fake.launches().map(game => game.configId), [tableOfTheWeek.getTable().configId]);
});

test("counts the week in the Streak through a Play of the Table of the Week, however launched", () => {
    const { fake, tableOfTheWeek } = createTableOfTheWeek();
    const weekTable = tableOfTheWeek.getTable();

    tableOfTheWeek.launch();
    fake.launchError(fake.launches()[0]);
    assert.equal(tableOfTheWeek.getStreak(), 0, "a failed launch does not count");

    fake.playGame(weekTable);
    playFor(fake, weekTable);
    assert.equal(tableOfTheWeek.getStreak(), 1);
});

test("a game under a minute on the Table of the Week neither starts nor extends a Streak, nor adds to Periods Played", () => {
    const { fake, tableOfTheWeek } = createTableOfTheWeek({
        streak: { current: 3, longest: 3, lastPeriod: "2026-09-14", periodsPlayed: 3 },
    });

    tableOfTheWeek.launch();
    playLastLaunch(fake, 59);

    assert.equal(tableOfTheWeek.getStreak(), 3, "this week can still extend the Streak");
    assert.equal(tableOfTheWeek.getPeriodsPlayed(), 3);
    fake.setNow(NEXT_MONDAY);
    assert.equal(tableOfTheWeek.getStreak(), 0, "the short game did not count for the week");
});

test("a Play started on Sunday night and ended on Monday counts for the week it started", () => {
    const { fake, tableOfTheWeek } = createTableOfTheWeek({
        now: new Date(2026, 8, 27, 23, 50, 0),
        lock: { configId: "Attack from Mars (Bally 1995)", period: "2026-09-21" },
        streak: { current: 3, longest: 3, lastPeriod: "2026-09-14", periodsPlayed: 3 },
    });

    tableOfTheWeek.launch();
    playLastLaunch(fake, 30 * 60);

    assert.deepEqual(readJson(fake, GUEST_FILE).streaks.tableOfTheWeek,
        { current: 4, longest: 4, lastPeriod: "2026-09-21", periodsPlayed: 4 });
});

test("counts several plays in one week once", () => {
    const { fake, tableOfTheWeek } = createTableOfTheWeek();

    for (let day = 0; day < 7; day++) {
        tableOfTheWeek.launch();
        playLastLaunch(fake);
        fake.advanceTime(DAY_MS);
    }

    fake.setNow(SUNDAY_NIGHT);
    assert.equal(tableOfTheWeek.getStreak(), 1);
});

test("grows the week Streak across the rollover and resets it after a skipped week", () => {
    const { fake, tableOfTheWeek } = createTableOfTheWeek({ now: SUNDAY_NIGHT });

    tableOfTheWeek.launch();
    playLastLaunch(fake);
    fake.setNow(NEXT_MONDAY);
    tableOfTheWeek.launch();
    playLastLaunch(fake);
    assert.equal(tableOfTheWeek.getStreak(), 2);

    fake.advanceTime(WEEK_MS);
    assert.equal(tableOfTheWeek.getStreak(), 2, "this week can still extend the Streak");

    fake.advanceTime(WEEK_MS);
    assert.equal(tableOfTheWeek.getStreak(), 0, "a whole week was skipped");

    tableOfTheWeek.launch();
    playLastLaunch(fake);
    assert.equal(tableOfTheWeek.getStreak(), 1);
});

test("reads and extends a week Streak stored in the active Profile", () => {
    const { fake, tableOfTheWeek } = createTableOfTheWeek({
        streak: { current: 11, longest: 11, lastPeriod: "2026-09-14", periodsPlayed: 20 },
    });
    assert.equal(tableOfTheWeek.getStreak(), 11);

    tableOfTheWeek.launch();
    playLastLaunch(fake);

    assert.equal(tableOfTheWeek.getStreak(), 12);
    assert.deepEqual(readJson(fake, GUEST_FILE).streaks.tableOfTheWeek,
        { current: 12, longest: 12, lastPeriod: "2026-09-21", periodsPlayed: 21 });
});

test("counts non-consecutive weeks once each in Periods Played", () => {
    const { fake, tableOfTheWeek } = createTableOfTheWeek();

    tableOfTheWeek.launch();
    playLastLaunch(fake);
    tableOfTheWeek.launch();
    playLastLaunch(fake);
    fake.advanceTime(2 * WEEK_MS);
    tableOfTheWeek.launch();
    playLastLaunch(fake);

    assert.equal(tableOfTheWeek.getPeriodsPlayed(), 2);
    assert.equal(tableOfTheWeek.getLongestStreak(), 1);
});

test("locks the Table of the Week in cabinet.json, never in PinballY's settings", () => {
    const { fake, tableOfTheWeek } = createTableOfTheWeek();

    const weekTable = tableOfTheWeek.getTable();
    tableOfTheWeek.launch();
    playLastLaunch(fake);

    assert.deepEqual(readJson(fake, CABINET_FILE).tableOfTheWeek, { configId: weekTable.configId, period: "2026-09-21" });
    assert.deepEqual([...fake.writtenSettingsKeys()], []);
});
