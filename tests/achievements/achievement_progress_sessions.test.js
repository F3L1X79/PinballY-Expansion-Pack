// ============================================================
// Achievement Progress of the marathon, Random Game and Day's Manufacturers
// Achievements, through main.js on the fake PinballY globals: a marathon
// shows the longest session in whole minutes rounded down and unlocks as
// it reaches its target; Random Games and the Day's Manufacturers record
// show their counts; rage quit and grand return show none.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, table, PROFILES_FOLDER } from "./achievement_progress_scenario.js";

const MEDIEVAL = table(1, "Medieval Madness", "Williams", 1997);

// 29 min 50 s: must read 29 minutes.
const LONGEST_SECONDS = 30 * 60 - 10;

test("marathons show whole minutes, Random Games and Day's Manufacturers their counts", async () => {
    const { fake, lang, play, readShown, unlockedRow, missingRow } = await startScenario({
        now: new Date(2026, 8, 23, 10, 0, 0),
        tables: [MEDIEVAL],
        files: {
            [`${PROFILES_FOLDER}\\guest\\profile.json`]: {
                version: 1, notified: [], plays: {}, randomGames: 7,
                sessions: { longestSeconds: LONGEST_SECONDS, mostManufacturersInADay: 2 },
            },
        },
    });
    const ACHIEVEMENT = lang.achievements;
    const halfHour = ACHIEVEMENT.marathonTitles[30];

    const fullHour = ACHIEVEMENT.marathonTitles[60];
    // The rage quit and the grand return are Secret Achievements, both "???".
    const { secretTitle } = lang.achievementList;
    assert.deepEqual(readShown([halfHour, fullHour, secretTitle, secretTitle]), [
        missingRow(halfHour, "minutes", 29, 30),
        missingRow(fullHour, "minutes", 29, 60),
        missingRow(secretTitle),
        missingRow(secretTitle),
    ]);
    const randomGames = [10, 25, 50, 100];
    assert.deepEqual(readShown(randomGames.map(count => ACHIEVEMENT.randomGamesTitles[count])),
        randomGames.map(count => missingRow(ACHIEVEMENT.randomGamesTitles[count], "randomGames", 7, count)));
    const dayManufacturers = [3, 5, 8, 10];
    assert.deepEqual(readShown(dayManufacturers.map(count => ACHIEVEMENT.dayManufacturersTitles[count])),
        dayManufacturers.map(count => missingRow(ACHIEVEMENT.dayManufacturersTitles[count], "manufacturers", 2, count)));

    // A half-hour session reaches the target exactly: the marathon unlocks.
    await play(MEDIEVAL, 30 * 60);
    assert.deepEqual(readShown([halfHour, fullHour]), [unlockedRow(halfHour), missingRow(fullHour, "minutes", 30, 60)]);

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
