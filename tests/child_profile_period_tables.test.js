// ============================================================
// Adult Period Tables for a Child Profile, through main.js on the fake
// PinballY globals: while the Table of the Day is an Adult Table, the
// child's main menu leaves it out and an adult Profile keeps it; the child's Streak goes on across that Period without counting
// it (Profile Stats and Achievement Progress agree) and still breaks on an
// ordinary missed Period, while an adult's Streak breaks as before.
// cabinet.json keeps those Periods next to the Table of the Day's lock,
// and drops one whose table is untagged during it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { pressAndGlide, readRows } from "./achievement_list_reader.js";
import { WELCOME_SCREEN_OPEN_MS, press } from "./welcome_screen_reader.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const CABINET = `${PROFILES}\\cabinet.json`;
const profileFile = name => `${PROFILES}\\${name}\\profile.json`;

const table = (id, title, manufacturer, year, categories) => ({
    id, configId: `${title} (${manufacturer} ${year})`, title, manufacturer, year, categories,
    playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false,
});
// With only two tables, a new day's table is always the other one: the
// Table of the Day alternates between them.
const PLAYBOY = table(1, "Playboy", "Bally", 1978, ["NSFW"]);
const MEDIEVAL = table(2, "Medieval Madness", "Williams", 1997, ["Fantasy"]);

const streakOf = (current, lastPeriod, periodsPlayed) => ({ current, longest: current, lastPeriod, periodsPlayed });

test("a Child Profile is never offered an Adult Period Table and keeps its Streak across that Period", async () => {
    // Wednesday 30 September 2026: today's table is an Adult Table.
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 30, 20, 0, 0), tables: [PLAYBOY, MEDIEVAL] });
    fake.addFile(profileFile("Alice"), JSON.stringify({
        version: 1, isChild: true, notified: [], plays: {},
        streaks: { tableOfTheDay: streakOf(3, "2026-09-29", 3) },
    }));
    fake.addFile(profileFile("Bob"), JSON.stringify({
        version: 1, notified: [], plays: {},
        streaks: { tableOfTheDay: streakOf(1, "2026-09-29", 1) },
    }));
    fake.addFile(CABINET, JSON.stringify({
        version: 1,
        activeProfile: "Alice",
        tableOfTheDay: { configId: PLAYBOY.configId, period: "2026-09-30" },
        tableOfTheWeek: { configId: MEDIEVAL.configId, period: "2026-09-28" },
    }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    const addOnsUnderTest = ["startupChoicePrompt", "profilePicker", "customMenuCommands", "achievements"];
    for (const key of Object.keys(config.addOns)) config.addOns[key] = addOnsUnderTest.includes(key);
    config.language = "en";

    const { default: lang } = await import("../common/i18n.js");
    const { getProfileStore } = await import("../common/profile_store.js");
    await import("../main.js");
    await settle();
    const store = getProfileStore();
    const LABELS = lang.customMenuLabels;
    const ACHIEVEMENTS = lang.achievements;
    const STATS = lang.profileStats;

    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    press(fake, "Exit");

    const openMainMenu = () => fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
    function mainMenuOffers() {
        openMainMenu();
        const titles = fake.currentMenu().items.map(item => item.title);
        fake.closeMenu();
        return [LABELS.tableOfTheDay, LABELS.tableOfTheWeek].filter(label => titles.includes(label));
    }
    function dayStreakShown() {
        openMainMenu();
        fake.selectMenuItem(STATS.menuEntry);
        const lines = fake.currentMenu().items.map(item => item.title);
        fake.closeMenu();
        return lines.find(line => line?.startsWith(STATS.tableOfTheDayStreak(0, 0).split(":")[0]));
    }
    function dayStreakProgress() {
        openMainMenu();
        fake.selectMenuItem(lang.achievementList.menuEntry);
        const rows = readRows(fake, lang.achievementList);
        pressAndGlide(fake, "Exit");
        const titles = [ACHIEVEMENTS.dailyStreakTitles[7], ACHIEVEMENTS.dailyPeriodsPlayedTitles[10]];
        return titles.map(title => rows.find(row => row.title === title).progress);
    }
    const PROGRESS = lang.achievementList.progressUnits;
    const progressOf = (streak, periodsPlayed) => [PROGRESS.daysInARow.short(streak, 7), PROGRESS.daysPlayed.short(periodsPlayed, 10)];
    async function playTableOfTheDay() {
        openMainMenu();
        fake.selectMenuItem(LABELS.tableOfTheDay);
        await settle();
        const launches = fake.launches();
        const game = launches[launches.length - 1];
        fake.gameStarted(game);
        fake.advanceTime(60 * 1000);
        fake.gameOver(game);
        await settle();
        return game;
    }
    async function goToDay(day) {
        fake.setNow(new Date(2026, 9, day, 20, 0, 0));
        // Somebody opens PinballY's menu that day, which picks its table.
        assert.ok(mainMenuOffers().includes(LABELS.tableOfTheWeek));
        await settle();
    }

    assert.deepEqual(mainMenuOffers(), [LABELS.tableOfTheWeek], "no Table of the Day entry for the child");
    assert.equal(dayStreakShown(), STATS.tableOfTheDayStreak(3, 3), "the child's Streak goes on across the adult day");
    assert.deepEqual(dayStreakProgress(), progressOf(3, 3));

    store.switchTo("Bob");
    await settle();
    assert.deepEqual(mainMenuOffers(), [LABELS.tableOfTheDay, LABELS.tableOfTheWeek], "an adult Profile keeps it");
    store.switchTo("Alice");
    await settle();

    // Thursday 1 October: back to an ordinary table, which extends the Streak.
    await goToDay(1);
    assert.deepEqual(mainMenuOffers(), [LABELS.tableOfTheDay, LABELS.tableOfTheWeek]);
    assert.equal(dayStreakShown(), STATS.tableOfTheDayStreak(3, 3), "today can still extend the Streak");
    assert.equal((await playTableOfTheDay()).configId, MEDIEVAL.configId);
    assert.equal(dayStreakShown(), STATS.tableOfTheDayStreak(4, 4));
    assert.deepEqual(dayStreakProgress(), progressOf(4, 4), "the adult day is not counted");

    store.switchTo("Bob");
    await settle();
    assert.equal(dayStreakShown(), STATS.tableOfTheDayStreak(0, 1), "an adult Profile's Streak broke on the adult day");
    store.switchTo("Alice");
    await settle();

    // 2 October is an adult day, 3 October an ordinary day the child misses.
    await goToDay(2);
    await goToDay(3);
    assert.deepEqual(mainMenuOffers(), [LABELS.tableOfTheDay, LABELS.tableOfTheWeek]);
    await goToDay(4);
    assert.deepEqual(mainMenuOffers(), [LABELS.tableOfTheWeek]);
    assert.equal(dayStreakShown(), STATS.tableOfTheDayStreak(0, 4), "an ordinary missed day breaks the Streak");
    assert.deepEqual(dayStreakProgress(), progressOf(0, 4));

    assert.deepEqual(JSON.parse(fake.readFile(CABINET)).tableOfTheDay, {
        configId: PLAYBOY.configId,
        period: "2026-10-04",
        adultPeriods: ["2026-09-30", "2026-10-02", "2026-10-04"],
    });

    // Untagged mid-day, the table is offered again and the day is an ordinary one.
    fake.setTables([{ ...PLAYBOY, categories: [] }, MEDIEVAL]);
    assert.deepEqual(mainMenuOffers(), [LABELS.tableOfTheDay, LABELS.tableOfTheWeek]);
    assert.deepEqual(JSON.parse(fake.readFile(CABINET)).tableOfTheDay.adultPeriods, ["2026-09-30", "2026-10-02"]);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
