// ============================================================
// Welcome Screen Challenge Table card at the Challenge's last step: with
// only the offered Table of the Day left, the card shows it anyway, with
// the last-step line instead of the progress.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { periodCards } from "./welcome_screen_reader.js";
import { startWithChallenge, playedOnce, countedGame, WEEK, WEEK_TABLE, STERN_A, STERN_B, STERN_C } from "./challenge_card_scenario.js";

test("one Play from the target, the Challenge Table card shows the Table of the Day", async () => {
    // Only Medieval Madness was never played; 2 of 3 never played tables done.
    const fake = await startWithChallenge({
        challenge: { week: WEEK, template: "neverPlayedTables", param: null, target: 3 },
        games: [countedGame(STERN_A), countedGame(STERN_B)],
        plays: playedOnce([WEEK_TABLE, STERN_A, STERN_B, STERN_C]),
    });

    assert.deepEqual(periodCards(fake)[2], {
        period: "A CHALLENGE TABLE", name: "Medieval Madness", mastery: periodCards(fake)[0].mastery, line: "One more game to finish the Challenge!",
    });
    assertNoErrorLogged(fake);
});
