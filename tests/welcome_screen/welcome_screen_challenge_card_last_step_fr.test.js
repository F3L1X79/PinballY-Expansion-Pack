// ============================================================
// Welcome Screen Challenge Table card at the Challenge's last step, in
// French: the last-step line.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { periodCards } from "./welcome_screen_reader.js";
import { startWithChallenge, playedOnce, countedGame, WEEK, WEEK_TABLE, STERN_A, STERN_B, STERN_C } from "./challenge_card_scenario.js";

test("the last-step line speaks French", async () => {
    // Set before the scenario loads i18n, which reads the language once.
    const fake = await startWithChallenge({
        challenge: { week: WEEK, template: "neverPlayedTables", param: null, target: 3 },
        games: [countedGame(STERN_A), countedGame(STERN_B)],
        plays: playedOnce([WEEK_TABLE, STERN_A, STERN_B, STERN_C]),
        language: "fr",
    });

    assert.equal(periodCards(fake)[2].line, "Plus qu'une partie pour finir le défi !");
    assertNoErrorLogged(fake);
});
