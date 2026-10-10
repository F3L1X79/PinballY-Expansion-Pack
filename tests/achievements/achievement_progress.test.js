// ============================================================
// Achievement Progress of the completion Achievements, through main.js on
// the fake PinballY globals and read in the Achievement List after real
// plays: a completion Achievement shows its tables played, drops its
// Achievement Progress once Unlocked, shows none for a target of 1, and
// follows a Profile switch.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { startScenario, table, PROFILES_FOLDER } from "./achievement_progress_scenario.js";

const MEDIEVAL = table(1, "Medieval Madness", "Williams", 1997, ["Fantasy"]);
const TWILIGHT = table(2, "Twilight Zone", "Williams", 1993, ["Fantasy"]);
const ADDAMS = table(3, "Addams Family", "Williams", 1992, ["Horror"]);
const MARS = table(4, "Attack from Mars", "Bally", 1995, ["SciFi"]);

test("a completion Achievement shows its tables played until it unlocks, and follows the active Profile", async () => {
    const { fake, lang, getProfileStore, play, readShown, unlockedRow, missingRow } = await startScenario({
        now: new Date(2026, 8, 23, 10, 0, 0),
        tables: [MEDIEVAL, TWILIGHT, ADDAMS, MARS],
        folders: [`${PROFILES_FOLDER}\\Alice`],
    });
    const ACHIEVEMENT = lang.achievements;
    const williams = ACHIEVEMENT.manufacturerCompletionTitle("Williams");
    const bally = ACHIEVEMENT.manufacturerCompletionTitle("Bally");
    const fantasy = ACHIEVEMENT.categoryCompletionTitle("Fantasy");
    const nineties = ACHIEVEMENT.decadeCompletionTitle(1990);

    assert.deepEqual(readShown([williams]), [missingRow(williams, "tables", 0, 3)]);

    await play(MEDIEVAL);
    assert.deepEqual(readShown([williams, bally, fantasy, nineties]), [
        missingRow(williams, "tables", 1, 3),
        // A target of 1 shows no Achievement Progress.
        missingRow(bally),
        missingRow(fantasy, "tables", 1, 2),
        missingRow(nineties, "tables", 1, 4),
    ]);

    getProfileStore().switchTo("Alice");
    await settle();
    assert.deepEqual(readShown([williams]), [missingRow(williams, "tables", 0, 3)], "Alice's own progress");

    getProfileStore().switchTo("guest");
    await settle();
    await play(TWILIGHT);
    await play(ADDAMS);
    assert.deepEqual(readShown([williams]), [unlockedRow(williams)], "Unlocked: no Achievement Progress");

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
