// ============================================================
// Welcome Screen Challenge Table card for a Child Profile: the Adult Table
// of the Day is neither offered nor a Challenge Table, so the card draws
// among the other Challenge Tables as usual.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { periodCards } from "./welcome_screen_reader.js";
import { startWithChallenge, playedOnce, WEEK, TABLES, DAY_TABLE, WEEK_TABLE, STERN_B } from "./challenge_card_scenario.js";

test("a Child Profile's Challenge Table card ignores the Adult Table of the Day", async t => {
    t.mock.method(Math, "random", () => 0);
    // Medieval Madness, Godzilla and Jaws were never played; Medieval Madness is an Adult Table.
    const fake = await startWithChallenge({
        challenge: { week: WEEK, template: "neverPlayedTables", param: null, target: 3 },
        tables: TABLES.map(table => (table === DAY_TABLE ? { ...table, categories: ["NSFW"] } : table)),
        plays: playedOnce([WEEK_TABLE, STERN_B]),
        profile: { isChild: true },
    });

    assert.deepEqual(periodCards(fake).map(card => card.name), ["Twilight Zone", "Godzilla"]);
    assertNoErrorLogged(fake);
});
