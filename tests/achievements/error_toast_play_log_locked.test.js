// ============================================================
// The Error Toast through main.js: a Play whose Play Log year file is
// locked is counted and announced as usual, then an Error Toast says it is
// missing from the play history, after that Play's other toasts. It holds
// 10 s and plays no toast sound.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import config from "../../common/core/config.js";
import { errorLines } from "../support/error_log.js";
import { MARS, playLogFile, playLocked, startErrorToastScenario, watchCards } from "./error_toast_scenario.js";

const SOUND_FILE = "C:\\Sounds\\achievement.wav";

test("a Play missing from the Play Log is counted, announced, then followed by an Error Toast", async () => {
    config.achievementSoundFile = SOUND_FILE;
    const { fake, profileStore } = await startErrorToastScenario({
        addOns: ["achievements"],
        files: { [playLogFile("Alice")]: JSON.stringify({ version: 1, plays: [] }), [SOUND_FILE]: "" },
    });
    const soundsBefore = fake.soundsPlayed().length;

    await playLocked(fake, playLogFile("Alice"));
    const cards = watchCards(fake);

    assert.equal(profileStore.getPlaysOf("Alice")[MARS.configId].count, 1, "the Play is counted");
    assert.ok(cards.length >= 2, `the Play's Achievements are announced, got ${cards.map(card => card.text)}`);
    const errorCard = cards.at(-1);
    assert.equal(errorCard.text, "PROBLEM | Attack from Mars | This game was counted, but it is missing from your play history.",
        "the Error Toast comes after the Play's other toasts");
    assert.ok(errorCard.shownMs >= 10000 && errorCard.shownMs < 10600, `holds 10 s, not ${errorCard.shownMs} ms`);
    for (const card of cards.slice(0, -1)) assert.ok(card.shownMs < 5000, "the other toasts keep their 4 s");
    assert.equal(fake.soundsPlayed().length - soundsBefore, cards.length - 1, "no toast sound for the Error Toast");

    assert.equal(errorLines(fake).length, 1);
    assert.match(errorLines(fake)[0], /^\[ProfileStore\] ERROR in handler: Error: Permission denied: .*play-log-2026\.json/);
});
