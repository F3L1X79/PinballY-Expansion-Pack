// ============================================================
// Welcome Screen Challenge Table card: the Last Played Table is drawn when
// it is the only Challenge Table left.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { periodCards } from "./welcome_screen_reader.js";
import { startWithChallenge, countedGame, STERN_A, STERN_B, STERN_C } from "./challenge_card_scenario.js";

test("the Last Played Table is the Challenge Table when it is the only one", async t => {
    t.mock.method(Math, "random", () => 0);
    const fake = await startWithChallenge({
        games: [countedGame(STERN_A), countedGame(STERN_B)],
        plays: { [STERN_C.configId]: { count: 1, seconds: 30, lastPlayed: "2026-09-22T21:00:00" } },
    });

    const [card] = periodCards(fake).filter(shown => shown.period === "A CHALLENGE TABLE");
    assert.equal(card.name, "Jaws");
    assert.equal(card.line, "Play 3 different Stern tables · 2/3");
    assertNoErrorLogged(fake);
});
