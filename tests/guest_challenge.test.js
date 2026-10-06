// ============================================================
// Guest follows the weekly Challenge like any other Profile, through
// main.js on the fake PinballY globals: the Challenge Card, the counted
// games, the Challenge Toast, the Challenge Tables, the Challenges
// Achievements and the verdict on the previous week. Guest
// still never shows in the Unlock Rate, and each Profile keeps its own
// progress across switches.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import { toastDrawings } from "./achievement_toast_reader.js";
import { pressAndGlide, readRows } from "./achievement_list_reader.js";
import config from "../common/config.js";

// Wednesday 23 September 2026: its week is keyed "2026-09-21".
const NOW = new Date(2026, 8, 23, 10, 0, 0);
const NEXT_MONDAY = new Date(2026, 8, 28, 10, 0, 0);
const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const CARD_Z_INDEX = 4500;
// Longer than a toast's whole life (rise, hold, fade).
const ONE_TOAST_MS = 6000;

const table = (id, title, manufacturer, year) => ({
    id, configId: title, title, manufacturer, year, categories: ["Fantasy"],
    playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false,
});
const MEDIEVAL = table(1, "Medieval Madness", "Williams", 1997);
const MARS = table(2, "Attack from Mars", "Bally", 1995);
const ELVIRA = table(3, "Elvira", "Bally", 1989);
const TABLES = [MEDIEVAL, MARS, ELVIRA];
const CHALLENGE = { week: "2026-09-21", template: "manufacturerTables", param: "Bally", target: 2 };

const ADD_ONS_UNDER_TEST = ["achievements", "challenges", "profilePicker"];

test("Guest follows the week's Challenge, completes it and earns its record, apart from the Unlock Rate", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: TABLES });
    // Alice and Bob too, so that the Unlock Rate shows.
    for (const name of ["guest", "Alice", "Bob"]) {
        fake.addFolder(`${PROFILES_FOLDER}\\${name}`);
        fake.addFile(`${PROFILES_FOLDER}\\${name}\\avatar.png`, "PNG");
    }
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({
        version: 1, activeProfile: "guest", challenge: { current: CHALLENGE, previous: null },
    }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";

    const { default: lang } = await import("../common/i18n.js");
    const { getProfileStore } = await import("../common/profile_store.js");
    await import("../main.js");
    await settle();
    const TEXT = lang.challenges;
    const LIST = lang.achievementList;
    const ACHIEVEMENT = lang.achievements;
    const title = TEXT.titles.manufacturerTables(2, "Bally");

    // The badge shares the card's Z index; only the card shows the Challenge's texts.
    const cardShows = text => fake.drawingLayers()
        .some(layer => layer.zIndex === CARD_Z_INDEX && layer.alpha > 0 && layer.texts().includes(text));
    const guestChallenge = () => JSON.parse(fake.readFile(`${PROFILES_FOLDER}\\guest\\profile.json`)).challenge;
    const openMainMenu = () => fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
    function challengeTables() {
        const [filter] = fake.scriptFilters().filter(({ id }) => id === "project.ChallengeTables");
        fake.setCurrentFilter(`User.${filter.id}`);
        fake.fire("wheelmode");
        return fake.getWheelTables().map(game => game.title);
    }
    function achievementRows() {
        openMainMenu();
        fake.selectMenuItem(LIST.menuEntry);
        const rows = readRows(fake, LIST);
        pressAndGlide(fake, "Exit");
        return rows;
    }
    async function play(game) {
        fake.gameStarted(game);
        await settle();
        fake.advanceTime(90 * 1000);
        fake.gameOver(game);
        await settle();
        fake.fire("wheelmode");
    }

    assert.ok(cardShows(title), "the card shows the week's Challenge to Guest");
    assert.ok(cardShows(TEXT.progress(0, 2, TEXT.daysLeft(5))));
    assert.deepEqual(challengeTables(), ["Attack from Mars", "Elvira"]);

    await play(MARS);
    assert.ok(cardShows(TEXT.progress(1, 2, TEXT.daysLeft(5))), "Guest's game moves its Challenge forward");
    assert.deepEqual(challengeTables(), ["Elvira"]);

    await play(ELVIRA);
    assert.equal(guestChallenge().completedCount, 1);
    for (let i = 0; i < 10; i++) fake.advanceTime(ONE_TOAST_MS);
    await settle();
    const toasts = toastDrawings(fake).map(drawing => drawing.texts.join(" | "));
    assert.ok(toasts.some(texts => texts.includes(title)), "the Challenge Toast shows");
    assert.ok(toasts.some(texts => texts.includes(ACHIEVEMENT.challengesCompletedTitles[1])), "and the Achievement Toast");

    const guestRows = achievementRows();
    const guestRow = guestRows.find(row => row.title === ACHIEVEMENT.challengesCompletedTitles[1]);
    assert.ok(guestRow && guestRow.unlocked, "Guest unlocked the first Challenges Achievement");
    const progressRow = guestRows.find(row => row.title === ACHIEVEMENT.challengesCompletedTitles[5]);
    assert.equal(progressRow.progress, LIST.progressUnits.challenges.short(1, 5));

    // Alice starts from zero and never sees Guest in the Unlock Rate.
    getProfileStore().switchTo("Alice");
    await settle();
    assert.ok(cardShows(TEXT.progress(0, 2, TEXT.daysLeft(5))), "Alice's own progress");
    const aliceRow = achievementRows().find(row => row.title === ACHIEVEMENT.challengesCompletedTitles[1]);
    assert.ok(!aliceRow.unlocked);
    assert.deepEqual(aliceRow.owners, { avatars: [], more: null }, "Guest never counts in the Unlock Rate");
    await play(MEDIEVAL);

    getProfileStore().switchTo("guest");
    await settle();
    assert.ok(cardShows(TEXT.completed), "Guest's Challenge is still completed");
    assert.deepEqual(guestChallenge().games.map(game => game.configId), ["Attack from Mars", "Elvira"]);

    // Next Monday, Guest gets the verdict on its completed Challenge.
    fake.setNow(NEXT_MONDAY);
    fake.fire("wheelmode");
    assert.ok(cardShows(TEXT.verdictHeader.toLocaleUpperCase()));
    assert.equal(guestChallenge().history.at(-1).completed, true);

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
