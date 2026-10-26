// ============================================================
// Welcome Screen Challenge Table card in French: its header and the
// Challenge's French title with the progress.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { periodCards } from "./welcome_screen_reader.js";
import { startWithChallenge, countedGame, STERN_A } from "./challenge_card_scenario.js";

test("the Challenge Table card speaks French", async t => {
    t.mock.method(Math, "random", () => 0.99);
    // Set before the scenario loads i18n, which reads the language once.
    const fake = await startWithChallenge({ games: [countedGame(STERN_A)], language: "fr" });
    const { default: lang } = await import("../../common/core/i18n.js");

    assert.deepEqual(periodCards(fake)[2], {
        period: "UNE TABLE DU DÉFI", name: "Jaws", mastery: lang.tableMastery.toDiscover, line: "Jouer 3 tables Stern différentes · 1/3",
    });
    assertNoErrorLogged(fake);
});
