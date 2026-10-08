// ============================================================
// Achievement Progress of the Daily Streak Achievements, through main.js on
// the fake PinballY globals: a locked one shows the current Daily Streak;
// the Play that reaches 3 days unlocks the first one, announced by its
// Achievement Toast; it stays Unlocked once the Daily Streak breaks, while
// the others fall back to 0.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, table, PROFILES_FOLDER } from "./achievement_progress_scenario.js";
import { toastDrawings } from "./achievement_toast_reader.js";

const MEDIEVAL = table(1, "Medieval Madness", "Williams", 1997);
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const playLog = starts => ({ version: 1, plays: starts.map(start => ({ start, configId: MEDIEVAL.configId, seconds: 600 })) });

test("Daily Streak Achievements show the current Daily Streak and stay Unlocked after a break", async () => {
    const { fake, lang, play, readShown, unlockedRow, missingRow } = await startScenario({
        // Thursday 8 October 2026, in the morning: today has no Play yet.
        now: new Date(2026, 9, 8, 10, 0, 0),
        tables: [MEDIEVAL],
        files: {
            [`${PROFILES_FOLDER}\\guest\\profile.json`]: { version: 1, notified: [], plays: {} },
            [`${PROFILES_FOLDER}\\guest\\play-log-2026.json`]: playLog(["2026-10-06T21:00:00", "2026-10-07T21:00:00"]),
        },
    });
    const ACHIEVEMENT = lang.achievements;
    const titles = [3, 7, 15, 30].map(days => ACHIEVEMENT.cabinetStreakTitles[days]);

    // Alive all day from yesterday: 2 days so far.
    assert.deepEqual(readShown(titles), [3, 7, 15, 30].map((days, index) => missingRow(titles[index], "daysInARow", 2, days)));

    await play(MEDIEVAL);
    assert.deepEqual(readShown(titles), [
        unlockedRow(titles[0]),
        missingRow(titles[1], "daysInARow", 3, 7),
        missingRow(titles[2], "daysInARow", 3, 15),
        missingRow(titles[3], "daysInARow", 3, 30),
    ]);
    const shownToasts = toastDrawings(fake).map(drawing => drawing.texts.join(" | "));
    assert.equal(shownToasts.filter(texts => texts.includes(titles[0])).length, 1, "one Achievement Toast for 3 days");
    assert.ok(shownToasts.some(texts => texts.includes(ACHIEVEMENT.cabinetStreakDescription(3))));

    // Saturday: Friday had no Play, the Daily Streak is broken.
    fake.advanceTime(2 * ONE_DAY_MS);
    assert.deepEqual(readShown(titles), [
        unlockedRow(titles[0]),
        missingRow(titles[1], "daysInARow", 0, 7),
        missingRow(titles[2], "daysInARow", 0, 15),
        missingRow(titles[3], "daysInARow", 0, 30),
    ]);

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
