// ============================================================
// Adult Period Tables for a Child Profile through main.js: the child's
// Welcome Screen, at startup and from the main menu, leaves an Adult Table
// of the Day out; its Streak goes on across that Period but breaks on an
// ordinary miss.
// cabinet.json keeps those Periods next to the lock.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { pressAndGlide, readRows, untilListShown } from "../achievements/achievement_list_reader.js";
import { WELCOME_SCREEN_OPEN_MS, press, periodCards, readChoices, choose, openFromMainMenu } from "../welcome_screen/welcome_screen_reader.js";
import { openProfileStats, section } from "../stats/profile_stats_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

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
    config.startupScreen = "welcome";

    const { default: lang } = await import("../../common/core/i18n.js");
    const { getProfileStore } = await import("../../common/profiles/profile_store.js");
    await import("../../main.js");
    await settle();
    const store = getProfileStore();
    const ACHIEVEMENTS = lang.achievements;

    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    const CARDS = lang.welcomeScreen.periodCards;
    assert.deepEqual(periodCards(fake).map(card => card.period), [CARDS.week.period], "no Table of the Day card for the child");
    assert.deepEqual(readChoices(fake), [
        lang.profiles.menuEntry, lang.buttonHints.close, CARDS.week.period, lang.welcomeScreen.randomTable, lang.welcomeScreen.stayOn("Medieval Madness"),
    ], "the selection skips it");
    press(fake, "Exit");

    const openMainMenu = () => fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
    // The Period cards of the Welcome Screen opened from the main menu.
    async function cardsOffered() {
        await openFromMainMenu(fake, lang.welcomeScreen.menuEntry);
        const periods = periodCards(fake).map(card => card.period);
        press(fake, "Exit");
        await settle();
        return periods;
    }
    function dayStreakProgress() {
        openMainMenu();
        fake.selectMenuItem(lang.achievementList.menuEntry);
        untilListShown(fake);
        const rows = readRows(fake, lang.achievementList);
        pressAndGlide(fake, "Exit");
        const titles = [ACHIEVEMENTS.dailyStreakTitles[7], ACHIEVEMENTS.dailyPeriodsPlayedTitles[10]];
        return titles.map(title => rows.find(row => row.title === title).progress);
    }
    // The day Streak in the Profile Stats: its value, then its pill.
    const STATS = lang.profileStats;
    function dayStreakShown() {
        openProfileStats(fake, lang);
        const progression = section(fake, STATS.sections.progression, STATS.stats);
        press(fake, "Exit");
        return progression[STATS.stats.dayStreak];
    }
    const PROGRESS = lang.achievementList.progressUnits;
    const progressOf = (streak, periodsPlayed) => [PROGRESS.daysInARow.short(streak, 7), PROGRESS.daysPlayed.short(periodsPlayed, 10)];
    async function playTableOfTheDay() {
        await openFromMainMenu(fake, lang.welcomeScreen.menuEntry);
        choose(fake, CARDS.day.period);
        await settle();
        const launches = fake.launches();
        const game = launches[launches.length - 1];
        fake.gameStarted(game);
        fake.advanceTime(60 * 1000);
        fake.gameOver(game);
        await settle();
        return game;
    }
    // Each switch brings the Welcome Screen back, closed right away.
    async function switchTo(name) {
        store.switchTo(name);
        await settle();
        fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
        press(fake, "Exit");
        await settle();
    }
    async function goToDay(day) {
        fake.setNow(new Date(2026, 9, day, 20, 0, 0));
        // Somebody opens the Welcome Screen that day, which picks its table.
        assert.ok((await cardsOffered()).includes(CARDS.week.period));
        await settle();
    }

    assert.deepEqual(await cardsOffered(), [CARDS.week.period], "no Table of the Day card from the main menu either");
    assert.deepEqual(dayStreakShown(), ["3", STATS.record(3)], "the child's Streak goes on across the adult day");
    assert.deepEqual(dayStreakProgress(), progressOf(3, 3));

    await switchTo("Bob");
    assert.deepEqual(await cardsOffered(), [CARDS.day.period, CARDS.week.period], "an adult Profile keeps it");
    await switchTo("Alice");

    // Thursday 1 October: back to an ordinary table, which extends the Streak.
    await goToDay(1);
    assert.deepEqual(await cardsOffered(), [CARDS.day.period, CARDS.week.period]);
    assert.deepEqual(dayStreakShown(), ["3", STATS.record(3)], "today can still extend the Streak");
    assert.equal((await playTableOfTheDay()).configId, MEDIEVAL.configId);
    assert.deepEqual(dayStreakShown(), ["4", STATS.record(4)]);
    assert.deepEqual(dayStreakProgress(), progressOf(4, 4), "the adult day is not counted");

    await switchTo("Bob");
    assert.deepEqual(dayStreakShown(), ["0", STATS.record(1)], "an adult Profile's Streak broke on the adult day");
    await switchTo("Alice");

    // 2 October is an adult day, 3 October an ordinary day the child misses.
    await goToDay(2);
    await goToDay(3);
    assert.deepEqual(await cardsOffered(), [CARDS.day.period, CARDS.week.period]);
    await goToDay(4);
    assert.deepEqual(await cardsOffered(), [CARDS.week.period]);
    assert.deepEqual(dayStreakShown(), ["0", STATS.record(4)], "an ordinary missed day breaks the Streak");
    assert.deepEqual(dayStreakProgress(), progressOf(0, 4));

    assert.deepEqual(JSON.parse(fake.readFile(CABINET)).tableOfTheDay, {
        configId: PLAYBOY.configId,
        period: "2026-10-04",
        adultPeriods: ["2026-09-30", "2026-10-02", "2026-10-04"],
    });

    // Untagged mid-day, the table is offered again and the day is an ordinary one.
    fake.setTables([{ ...PLAYBOY, categories: [] }, MEDIEVAL]);
    assert.deepEqual(await cardsOffered(), [CARDS.day.period, CARDS.week.period]);
    assert.deepEqual(JSON.parse(fake.readFile(CABINET)).tableOfTheDay.adultPeriods, ["2026-09-30", "2026-10-02"]);
    assertNoErrorLogged(fake);
});
