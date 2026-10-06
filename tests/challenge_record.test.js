// ============================================================
// Completed Challenges in the player's record, through main.js on the fake
// PinballY globals: the Challenges Achievements in the Achievement List
// unlock on the Profile's completed count and show their Achievement
// Progress, counting the week's Challenge as soon as it is completed.
// Guest has its own record, empty here.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { pressAndGlide, readRows } from "./achievement_list_reader.js";

// Wednesday 23 September 2026: its week is keyed "2026-09-21".
const NOW = new Date(2026, 8, 23, 10, 0, 0);
const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
// Longer than a toast's whole life (rise, hold, fade).
const ONE_TOAST_MS = 6000;

const table = (id, title, manufacturer, year) => ({
    id, configId: title, title, manufacturer, year, categories: ["Fantasy"],
    playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false,
});
const TABLES = [table(1, "Medieval Madness", "Williams", 1997), table(2, "Attack from Mars", "Bally", 1995)];

const verdict = (week, completed) =>
    ({ week, template: "differentTables", param: null, target: 3, reached: completed ? 3 : 1, completed });

// Four Challenges completed, one missed; this week's follows, not completed yet.
const ALICE_CHALLENGE = {
    firstWeek: "2026-08-17", week: "2026-09-21", games: [], completed: false, completedCount: 4,
    judgedWeek: "2026-09-14",
    history: [
        verdict("2026-08-17", true), verdict("2026-08-24", true), verdict("2026-08-31", true),
        verdict("2026-09-07", true), verdict("2026-09-14", false),
    ],
};
const CABINET = {
    version: 1,
    activeProfile: "Alice",
    challenge: {
        current: { week: "2026-09-21", template: "differentTables", param: null, target: 2 },
        previous: { week: "2026-09-14", template: "differentTables", param: null, target: 3 },
    },
};

const ADD_ONS_UNDER_TEST = ["achievements", "challenges", "profilePicker"];

test("completed Challenges unlock the Challenges Achievements", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: TABLES });
    fake.addFolder(`${PROFILES_FOLDER}\\Alice`);
    fake.addFile(`${PROFILES_FOLDER}\\Alice\\profile.json`,
        JSON.stringify({ version: 1, plays: {}, notified: [], challenge: ALICE_CHALLENGE }));
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify(CABINET));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";

    const { default: lang } = await import("../common/i18n.js");
    const { getProfileStore } = await import("../common/profile_store.js");
    await import("../main.js");
    await settle();
    const LIST = lang.achievementList;
    const ACHIEVEMENT = lang.achievements;

    const openMainMenu = () => fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
    // How the Achievement List shows each Challenges Achievement:
    // "✓ title" when Unlocked, "title progress" otherwise.
    function challengeRows() {
        openMainMenu();
        fake.selectMenuItem(LIST.menuEntry);
        const rows = readRows(fake, LIST);
        pressAndGlide(fake, "Exit");
        const titles = Object.values(ACHIEVEMENT.challengesCompletedTitles);
        return rows.filter(row => titles.includes(row.title))
            .map(row => (row.unlocked ? `✓ ${row.title}` : `${row.title} ${row.progress}`));
    }
    const withProgress = (count, current) =>
        `${ACHIEVEMENT.challengesCompletedTitles[count]} ${LIST.progressUnits.challenges.short(current, count)}`;
    async function play(game) {
        fake.gameStarted(game);
        await settle();
        fake.advanceTime(90 * 1000);
        fake.gameOver(game);
        await settle();
        for (let i = 0; i < 10; i++) fake.advanceTime(ONE_TOAST_MS);
        await settle();
    }

    assert.deepEqual(challengeRows(), [
        `✓ ${ACHIEVEMENT.challengesCompletedTitles[1]}`,
        withProgress(5, 4), withProgress(10, 4), withProgress(25, 4), withProgress(50, 4), withProgress(100, 4),
    ]);

    // Two different tables complete the week's Challenge: the fifth one.
    await play(TABLES[0]);
    await play(TABLES[1]);
    assert.deepEqual(challengeRows().slice(0, 3), [
        `✓ ${ACHIEVEMENT.challengesCompletedTitles[5]}`,
        `✓ ${ACHIEVEMENT.challengesCompletedTitles[1]}`,
        withProgress(10, 5),
    ], "the latest one first");
    const { notified } = JSON.parse(fake.readFile(`${PROFILES_FOLDER}\\Alice\\profile.json`));
    assert.deepEqual(notified.filter(id => id.startsWith("challengesCompleted:")), ["challengesCompleted:1", "challengesCompleted:5"]);

    // Next Monday the completed Challenge becomes a verdict: counted once.
    fake.setNow(new Date(2026, 8, 28, 10, 0, 0));
    fake.fire("wheelmode");
    const judged = JSON.parse(fake.readFile(`${PROFILES_FOLDER}\\Alice\\profile.json`)).challenge;
    assert.equal(judged.history.at(-1).completed, true);

    // Guest has its own record, Alice's completed Challenges left out.
    getProfileStore().switchTo("guest");
    await settle();
    // A target of 1 shows no Achievement Progress.
    assert.deepEqual(challengeRows(), [
        `${ACHIEVEMENT.challengesCompletedTitles[1]} null`,
        ...[5, 10, 25, 50, 100].map(count => withProgress(count, 0)),
    ]);

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
