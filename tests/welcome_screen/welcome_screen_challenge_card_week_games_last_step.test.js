// ============================================================
// Welcome Screen Challenge Table card with a "N games on the Table of the
// Week" Challenge at its last step: the card shows the Table of the Week.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { periodCards } from "./welcome_screen_reader.js";
import { startWithChallenge, countedGame, WEEK, WEEK_TABLE } from "./challenge_card_scenario.js";

test("a Table of the Week Challenge's last step shows the Table of the Week on the Challenge Table card", async () => {
    // 4 of 5 games.
    const fake = await startWithChallenge({
        challenge: { week: WEEK, template: "tableOfTheWeekGames", param: null, target: 5 },
        games: [1, 2, 3, 4].map(() => ({ ...countedGame(WEEK_TABLE), isTableOfTheWeek: true })),
    });

    const card = periodCards(fake)[2];
    assert.equal(card.name, "Twilight Zone");
    assert.equal(card.line, "One more game to finish the Challenge!");
    assertNoErrorLogged(fake);
});
