// ============================================================
// Achievement Progress of the Collection and Play Time Achievements,
// through main.js on the fake PinballY globals: a collection milestone
// shows the distinct tables played against the count its percentage needs;
// play time shows hours rounded down to one decimal, so it never reads the
// target before the Achievement unlocks; a target of 1 shows none.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { startScenario, table, PROFILES_FOLDER } from "./achievement_progress_scenario.js";

const TABLES = Array.from({ length: 10 }, (_, index) => table(index + 1, `Table ${index + 1}`, "Williams", 1990));
const [FIRST, SECOND] = TABLES;

// 4 h 59 min: 4.98 hours, which must read 4.9.
const PLAYED_SECONDS = 5 * 3600 - 60;

test("collection milestones show the tables played, play time the hours rounded down", async () => {
    const { fake, lang, getProfileStore, play, readShown, unlockedRow, missingRow } = await startScenario({
        now: new Date(2026, 8, 23, 10, 0, 0),
        tables: TABLES,
        folders: [`${PROFILES_FOLDER}\\Alice`],
        files: {
            [`${PROFILES_FOLDER}\\guest\\profile.json`]: {
                version: 1,
                notified: [],
                plays: {
                    [FIRST.configId]: { count: 3, seconds: PLAYED_SECONDS - 600, lastPlayed: "2026-09-01T20:00:00" },
                    [SECOND.configId]: { count: 1, seconds: 600, lastPlayed: "2026-09-02T20:00:00" },
                },
            },
        },
    });
    const ACHIEVEMENT = lang.achievements;

    const collection = [ACHIEVEMENT.firstTableTitle(), ...[10, 25, 50, 75, 100].map(percent => ACHIEVEMENT.collectionPercentTitles[percent])];
    assert.deepEqual(readShown(collection), [
        unlockedRow(collection[0]),
        unlockedRow(collection[1]),
        missingRow(collection[2], "tables", 2, 3),
        missingRow(collection[3], "tables", 2, 5),
        missingRow(collection[4], "tables", 2, 8),
        missingRow(collection[5], "tables", 2, 10),
    ]);

    const playTime = [1, 5, 10, 50, 100].map(hours => ACHIEVEMENT.playTimeMilestoneTitles[hours]);
    assert.deepEqual(readShown(playTime), [
        unlockedRow(playTime[0]),
        missingRow(playTime[1], "hours", 4.9, 5),
        missingRow(playTime[2], "hours", 4.9, 10),
        missingRow(playTime[3], "hours", 4.9, 50),
        missingRow(playTime[4], "hours", 4.9, 100),
    ]);

    // A one-minute Play reaches the 5 hours exactly: the Achievement unlocks
    // as its Achievement Progress reaches its target.
    await play(SECOND, 60);
    assert.deepEqual(readShown(playTime.slice(0, 3)), [
        unlockedRow(playTime[0]),
        unlockedRow(playTime[1]),
        missingRow(playTime[2], "hours", 5, 10),
    ]);

    // Nothing played: the targets of 1 show no Achievement Progress.
    getProfileStore().switchTo("Alice");
    await settle();
    assert.deepEqual(readShown([...collection.slice(0, 2), playTime[0]]),
        [missingRow(collection[0]), missingRow(collection[1]), missingRow(playTime[0])]);

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
