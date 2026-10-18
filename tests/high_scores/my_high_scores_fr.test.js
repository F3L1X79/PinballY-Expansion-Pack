// ============================================================
// My High Scores in French, through main.js on the fake PinballY globals:
// the entry reads "Mes meilleurs scores", right under "Tables les plus
// jouées".
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, HIGH_SCORES_FILE, MEDIEVAL } from "./high_scores_scenario.js";
import { mainMenuSection } from "../support/main_menu_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const HIGH_SCORES = {
    version: 1,
    tables: { [MEDIEVAL]: { board: [{ rank: 1, initials: "ALI", score: 1000, owner: "Alice" }] } },
    highScores: [],
};

test("the French entry reads Mes meilleurs scores", async () => {
    const { fake } = await startHighScores({
        addOns: ["highScores", "hallOfFame"],
        profiles: { Alice: {} },
        active: "Alice",
        files: { [HIGH_SCORES_FILE]: JSON.stringify(HIGH_SCORES) },
        language: "fr",
    });

    assert.deepEqual(mainMenuSection(fake, "Mes meilleurs scores"),
        ["All Tables", "Tables les plus jouées", "Mes meilleurs scores", "Favorites"]);

    assertNoErrorLogged(fake);
});
