// ============================================================
// Welcome Screen Challenge Table card: a Challenge Table that is also the
// offered Table of the Day is never drawn while another one is left.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { periodCards } from "./welcome_screen_reader.js";
import { startWithChallenge, playedOnce, WEEK, WEEK_TABLE, STERN_B, STERN_C } from "./challenge_card_scenario.js";

test("the Challenge Table card never repeats the Table of the Day", async t => {
    // The first candidate: Medieval Madness, were it not offered already.
    t.mock.method(Math, "random", () => 0);
    // Medieval Madness and Godzilla were never played.
    const fake = await startWithChallenge({
        challenge: { week: WEEK, template: "neverPlayedTables", param: null, target: 3 },
        plays: playedOnce([WEEK_TABLE, STERN_B, STERN_C]),
    });
    const { default: lang } = await import("../../common/core/i18n.js");

    const cards = periodCards(fake);
    assert.deepEqual(cards.map(card => card.name), ["Medieval Madness", "Twilight Zone", "Godzilla"]);
    assert.equal(cards[2].line, lang.welcomeScreen.periodCards.challenge.progress(lang.challenges.titles.neverPlayedTables(3, null), 0, 3));
    assertNoErrorLogged(fake);
});
