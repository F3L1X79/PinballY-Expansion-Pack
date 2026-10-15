// ============================================================
// ROM-less High Scores, first Play on an original table, through main.js
// on the fake PinballY globals: PinballY reads no board for it, so the
// Add-on learns the VPReg.stg section the Play changed, takes that
// section's board before the Play as its Default Scores and credits the
// Play's new place to the active Profile, with the toast, the
// Achievements and the stats lines of a ROM table.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startHighScores, ZELDA, ZELDA_TABLE, ZELDA_FACTORY, OTHER_SECTIONS, vpregBoard, highScoreIds,
} from "./high_scores_scenario.js";
import { readOwnSection } from "../stats/profile_stats_reader.js";

test("the first Play on an original table learns its section and credits the new place", async () => {
    const { fake, setVpreg, play, saved, log, toasts, showEveryToast, notified } = await startHighScores({
        addOns: ["highScores", "achievements", "customMenuCommands"], profiles: { Alice: {} }, active: "Alice", tables: [ZELDA_TABLE],
    });
    setVpreg({ ...OTHER_SECTIONS, ZELDA: ZELDA_FACTORY });

    await play(ZELDA, {
        afterVpreg: {
            ...OTHER_SECTIONS,
            ZELDA: { ...vpregBoard(["AAA", 2800000], ["FEF", 2750000], ["BBB", 2700000], ["CCC", 2600000]), TotalGamesPlayed: "20" },
        },
    });
    await showEveryToast();

    assert.deepEqual(saved(), {
        version: 1,
        tables: {
            [ZELDA]: {
                board: [
                    { rank: 1, initials: "AAA", score: 2800000, owner: null },
                    { rank: 2, initials: "FEF", score: 2750000, owner: "Alice" },
                    { rank: 3, initials: "BBB", score: 2700000, owner: null },
                    { rank: 4, initials: "CCC", score: 2600000, owner: null },
                ],
            },
        },
        highScores: [
            { profile: "Alice", configId: ZELDA, score: 2750000, initials: "FEF", place: 2, date: "2026-10-12T20:00:00", tableRecord: false, takenFrom: null },
        ],
        learnedSources: { [ZELDA]: { kind: "vpreg", section: "ZELDA" } },
    });
    assert.deepEqual(log().filter(line => !line.includes("the high scores read failed")), [
        `[HighScores] "${ZELDA}": VPReg.stg section "ZELDA" learned.`,
        `[HighScores] "${ZELDA}": first board read, 4 places, all Default Scores.`,
        `[HighScores] "${ZELDA}": High Score for Alice: place 2, 2750000 (FEF).`,
    ]);
    assert.deepEqual(toasts().filter(text => text.includes("HIGH SCORE")), ["2 | HIGH SCORE | High score on Zelda: 2nd place | 2,750,000 points"]);
    assert.deepEqual(highScoreIds(notified("Alice")), ["highScoreTables:1"]);
    assert.equal(fake.openFileHandleCount(), 0, "VPReg.stg is closed after each read");

    const { default: lang } = await import("../../common/core/i18n.js");
    const TEXT = lang.profileStats;
    const progression = readOwnSection(fake, lang, TEXT.sections.progression);
    assert.deepEqual([progression[TEXT.stats.highScoresHeld], progression[TEXT.stats.tableRecordsHeld]], [["1"], ["0"]]);
});
