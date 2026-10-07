// ============================================================
// Welcome Screen Collection Mastery card at the last tier, in English and
// French texts, through main.js on the fake PinballY globals: every table
// at Mastery Level 10, the card says so and shows no count.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { openCollectionCard, tableNumbered } from "./welcome_screen_collection_scenario.js";
import fr from "../lang/fr.js";

test("at tier 10 the card says every table reached the last level", async () => {
    const tables = Array.from({ length: 11 }, (_, index) => tableNumbered(index + 1));
    const { card, errors } = await openCollectionCard({ tables, levels: tables.map(() => 10) });

    assert.deepEqual(card, { goal: "All your tables: Pinball Wizard", current: null, tier: 10 });
    assert.equal(fr.tableMastery.collection.allTables("Mage du flipper"), "Toutes tes tables : Mage du flipper");
    assert.deepEqual(errors, []);
});
