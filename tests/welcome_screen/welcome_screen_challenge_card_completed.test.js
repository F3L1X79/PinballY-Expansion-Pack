// ============================================================
// Welcome Screen without a Challenge Table card: a completed Challenge
// leaves the cards and the choices unchanged.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { periodCards, readChoices } from "./welcome_screen_reader.js";
import { startWithChallenge, choicesWithoutChallengeCard, countedGame, STERN_A, STERN_B } from "./challenge_card_scenario.js";

test("a completed Challenge adds no card to the Welcome Screen", async () => {
    const fake = await startWithChallenge({
        // Two Stern tables out of three: Jaws would still move it forward, were it not completed.
        challenge: { week: "2026-09-21", template: "manufacturerTables", param: "Stern", target: 2 },
        games: [countedGame(STERN_A), countedGame(STERN_B)],
        completed: true,
    });
    const { default: lang } = await import("../../common/core/i18n.js");

    assert.equal(periodCards(fake).length, 2);
    assert.deepEqual(readChoices(fake), choicesWithoutChallengeCard(lang));
    assertNoErrorLogged(fake);
});
