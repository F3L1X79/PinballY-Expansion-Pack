// ============================================================
// Welcome Screen Challenge Table card at the Challenge's last step: another
// Challenge Table than the offered Table of the Day is still drawn, with
// the last-step line.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { periodCards } from "./welcome_screen_reader.js";
import { startWithChallenge, playedOnce, countedGame, WEEK, WEEK_TABLE, STERN_A, STERN_B } from "./challenge_card_scenario.js";

test("one Play from the target, another Challenge Table is drawn rather than the Table of the Day", async t => {
    // The first candidate: Medieval Madness, were it not offered already.
    t.mock.method(Math, "random", () => 0);
    // Medieval Madness and Jaws were never played; 2 of 3 never played tables done.
    const fake = await startWithChallenge({
        challenge: { week: WEEK, template: "neverPlayedTables", param: null, target: 3 },
        games: [countedGame(STERN_A), countedGame(STERN_B)],
        plays: playedOnce([WEEK_TABLE, STERN_A, STERN_B]),
    });

    const card = periodCards(fake)[2];
    assert.equal(card.name, "Jaws");
    assert.equal(card.line, "One more game to finish the Challenge!");
    assertNoErrorLogged(fake);
});
