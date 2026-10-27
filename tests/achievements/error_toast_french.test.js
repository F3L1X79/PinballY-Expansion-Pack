// ============================================================
// The Error Toast through main.js in French: its header and its sentence.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import config from "../../common/core/config.js";
import { errorLines } from "../support/error_log.js";

test("the Error Toast speaks French", async () => {
    // Read at i18n's first load, which the scenario's import brings.
    config.language = "fr";
    const { playLocked, profileFile, startErrorToastScenario, watchCards } = await import("./error_toast_scenario.js");
    const { fake } = await startErrorToastScenario();

    await playLocked(fake, profileFile("Alice"));

    assert.deepEqual(watchCards(fake).map(card => card.text),
        ["PROBLÈME | Attack from Mars | Cette partie n'a pas pu être enregistrée : elle ne comptera pas dans vos statistiques."]);
    assert.equal(errorLines(fake).length, 1, "the Profile data's write failure");
});
