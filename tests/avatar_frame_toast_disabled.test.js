// ============================================================
// Table Mastery off, through main.js on the fake PinballY globals: no
// Avatar Frame line ever shows, and nothing is written about frames.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startScenario, allToasts, play, errorLines, playedFor, profileFile, TABLES, MINUTE, ONE_TOAST_MS,
} from "./mastery_bar_scenario.js";

const [FIRST, SECOND, THIRD, FOURTH] = TABLES;
const levelOne = playedFor(MINUTE);
const savedData = (fake, name) => JSON.parse(fake.readFile(profileFile(name)));

test("with Table Mastery off, no frame line ever shows", async () => {
    const fake = await startScenario({
        addOns: ["achievements"],
        profiles: { guest: { plays: { [FIRST.configId]: levelOne, [SECOND.configId]: levelOne, [THIRD.configId]: levelOne } } },
    });
    fake.advanceTime(ONE_TOAST_MS);

    await play(fake, FOURTH, MINUTE);
    fake.advanceTime(4 * ONE_TOAST_MS);

    assert.deepEqual(allToasts(fake).filter(texts => texts.includes("frame")), []);
    assert.equal("avatarFrame" in savedData(fake, "guest"), false);
    assert.deepEqual(errorLines(fake), []);
});
