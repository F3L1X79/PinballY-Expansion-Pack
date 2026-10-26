// ============================================================
// Welcome Screen Challenge Table card: with the offered Table of the Week
// as the only Challenge Table left, before the last step, there is no card
// and the choice loop is the one without it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { periodCards, readChoices } from "./welcome_screen_reader.js";
import { startWithChallenge, playedOnce, choicesWithoutChallengeCard, WEEK, DAY_TABLE, STERN_A, STERN_B, STERN_C } from "./challenge_card_scenario.js";

test("no Challenge Table card when only the offered Table of the Week is left", async () => {
    // Only Twilight Zone was never played.
    const fake = await startWithChallenge({
        challenge: { week: WEEK, template: "neverPlayedTables", param: null, target: 3 },
        plays: playedOnce([DAY_TABLE, STERN_A, STERN_B, STERN_C]),
    });
    const { default: lang } = await import("../../common/core/i18n.js");

    assert.equal(periodCards(fake).length, 2);
    assert.deepEqual(readChoices(fake), choicesWithoutChallengeCard(lang));
    assertNoErrorLogged(fake);
});
