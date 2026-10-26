// ============================================================
// Welcome Screen Challenge Table card with a "Table of the Day on N days"
// Challenge at its last step: the card shows the Table of the Day.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { periodCards } from "./welcome_screen_reader.js";
import { startWithChallenge, countedGame, WEEK, DAY_TABLE } from "./challenge_card_scenario.js";

test("a Table of the Day Challenge's last step shows the Table of the Day on the Challenge Table card", async () => {
    // 2 of 3 days.
    const fake = await startWithChallenge({
        challenge: { week: WEEK, template: "tableOfTheDayDays", param: null, target: 3 },
        games: ["2026-09-21", "2026-09-22"].map(day => ({ ...countedGame(DAY_TABLE), isTableOfTheDay: true, day })),
    });

    const card = periodCards(fake)[2];
    assert.equal(card.name, "Medieval Madness");
    assert.equal(card.line, "One more game to finish the Challenge!");
    assertNoErrorLogged(fake);
});
