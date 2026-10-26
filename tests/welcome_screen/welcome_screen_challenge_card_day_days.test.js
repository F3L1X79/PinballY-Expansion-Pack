// ============================================================
// Welcome Screen Challenge Table card with a "Table of the Day on N days"
// Challenge: no card before the last step, the Table of the Day card does
// the job.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { periodCards, readChoices } from "./welcome_screen_reader.js";
import { startWithChallenge, countedGame, choicesWithoutChallengeCard, WEEK, DAY_TABLE } from "./challenge_card_scenario.js";

test("no Challenge Table card for a Table of the Day Challenge before its last step", async () => {
    // 1 of 3 days.
    const fake = await startWithChallenge({
        challenge: { week: WEEK, template: "tableOfTheDayDays", param: null, target: 3 },
        games: [{ ...countedGame(DAY_TABLE), isTableOfTheDay: true, day: "2026-09-21" }],
    });
    const { default: lang } = await import("../../common/core/i18n.js");

    assert.equal(periodCards(fake).length, 2);
    assert.deepEqual(readChoices(fake), choicesWithoutChallengeCard(lang));
    assertNoErrorLogged(fake);
});
