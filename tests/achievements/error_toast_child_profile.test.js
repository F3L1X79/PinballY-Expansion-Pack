// ============================================================
// The Error Toast through main.js goes to the Profile that played, a Child
// Profile too: its Play missing from the Play Log is told to it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLines } from "../support/error_log.js";
import { playLogFile, playLocked, startErrorToastScenario, watchCards } from "./error_toast_scenario.js";

test("a Child Profile sees the Error Toast of its own Play", async () => {
    const { fake } = await startErrorToastScenario({
        profile: { name: "Bob", data: { isChild: true } },
        files: { [playLogFile("Bob")]: JSON.stringify({ version: 1, plays: [] }) },
    });

    await playLocked(fake, playLogFile("Bob"));

    assert.deepEqual(watchCards(fake).map(card => card.text),
        ["PROBLEM | Attack from Mars | This game was counted, but it is missing from your play history."]);
    assert.equal(errorLines(fake).length, 1, "the Play Log's write failure");
});
