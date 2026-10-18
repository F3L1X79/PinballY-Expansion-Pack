// ============================================================
// My High Scores for Guest and a Child Profile, through main.js on the
// fake PinballY globals: both get the entry when they hold a place; a
// Child Profile's Adult Tables are left out, and a child whose only places
// are on Adult Tables gets no entry.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, HIGH_SCORES_FILE, MEDIEVAL, AFM, TABLES } from "./high_scores_scenario.js";
import { mainMenuSection } from "../support/main_menu_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { settle } from "../support/fake_pinbally_host.js";

const FILTER_ID = "User.project.MyHighScores";
// Attack from Mars is an Adult Table here.
const ADULT_TABLES = TABLES.map(table => (table.configId === AFM ? { ...table, categories: ["NSFW"] } : table));

const place = (rank, owner) => ({ rank, initials: "AAA", score: 1000 - rank, owner });
const HIGH_SCORES = {
    version: 1,
    tables: {
        [MEDIEVAL]: { board: [place(1, "guest"), place(2, "Alice")] },
        [AFM]: { board: [place(1, "Alice"), place(2, "Bob")] },
    },
    highScores: [],
};

const wheelTitles = fake => fake.getWheelTables().map(game => game.title);

test("Guest and a Child Profile get My High Scores, the Adult Tables left out for the child", async () => {
    const { fake, switchTo } = await startHighScores({
        profiles: { guest: {}, Alice: { isChild: true }, Bob: { isChild: true } },
        active: "Alice",
        tables: ADULT_TABLES,
        files: { [HIGH_SCORES_FILE]: JSON.stringify(HIGH_SCORES) },
    });
    const { default: lang } = await import("../../common/core/i18n.js");
    const { myHighScoresFilter } = lang.customMenuLabels;

    assert.notEqual(mainMenuSection(fake, myHighScoresFilter), null, "the child's entry");
    fake.selectFilter(FILTER_ID);
    fake.fire("wheelmode");
    assert.deepEqual(wheelTitles(fake), ["Medieval Madness"], "her Table Record on an Adult Table left out");

    switchTo("Bob");
    await settle();
    assert.equal(mainMenuSection(fake, myHighScoresFilter), null, "no entry: his only place is on an Adult Table");

    switchTo("guest");
    await settle();
    assert.notEqual(mainMenuSection(fake, myHighScoresFilter), null, "Guest's entry");
    fake.selectFilter(FILTER_ID);
    fake.fire("wheelmode");
    assert.deepEqual(wheelTitles(fake), ["Medieval Madness"]);

    assertNoErrorLogged(fake);
});
