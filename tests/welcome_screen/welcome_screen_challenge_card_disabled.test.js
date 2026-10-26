// ============================================================
// Welcome Screen with the Challenges Add-on disabled: no Challenge Table
// card, though a Challenge with Challenge Tables is locked in cabinet.json.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { periodCards, readChoices } from "./welcome_screen_reader.js";
import { startWithChallenge, choicesWithoutChallengeCard } from "./challenge_card_scenario.js";

test("with the Challenges Add-on disabled, the Welcome Screen has no Challenge Table card", async () => {
    const fake = await startWithChallenge({ addOns: ["startupChoicePrompt", "profilePicker"] });
    const { default: lang } = await import("../../common/core/i18n.js");

    assert.equal(periodCards(fake).length, 2);
    assert.deepEqual(readChoices(fake), choicesWithoutChallengeCard(lang));
    assertNoErrorLogged(fake);
});
