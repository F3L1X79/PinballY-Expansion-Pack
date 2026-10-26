// ============================================================
// Welcome Screen Challenge Table card with a "N games on the Table of the
// Week" Challenge: no card before the last step, the Table of the Week
// card does the job.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { periodCards, readChoices } from "./welcome_screen_reader.js";
import { startWithChallenge, countedGame, choicesWithoutChallengeCard, WEEK, WEEK_TABLE } from "./challenge_card_scenario.js";

test("no Challenge Table card for a Table of the Week Challenge before its last step", async () => {
    // 2 of 5 games.
    const fake = await startWithChallenge({
        challenge: { week: WEEK, template: "tableOfTheWeekGames", param: null, target: 5 },
        games: [1, 2].map(() => ({ ...countedGame(WEEK_TABLE), isTableOfTheWeek: true })),
    });
    const { default: lang } = await import("../../common/core/i18n.js");

    assert.equal(periodCards(fake).length, 2);
    assert.deepEqual(readChoices(fake), choicesWithoutChallengeCard(lang));
    assertNoErrorLogged(fake);
});
