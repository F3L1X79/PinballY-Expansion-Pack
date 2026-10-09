// ============================================================
// A Collection Tier kept in profile.json, through main.js on the fake
// PinballY globals: once a table leaves the visible set and the tables
// no longer reach it, it stays, and no lower tier is announced.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startScenario, collectionToasts, savedCollectionTier, play, errorLines, playedFor, MINUTE, ONE_TOAST_MS,
} from "./mastery_bar_scenario.js";

const tableNumbered = number => ({
    id: number, configId: `Table ${number} (Bally 1990)`, title: `Table ${number}`, manufacturer: "Bally", year: 1990,
    categories: [], playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false,
});
// Nine tables at Mastery Level 2, one a minute short of it, one never played.
const TABLES = Array.from({ length: 11 }, (_, index) => tableNumbered(index + 1));
const [LEAVING, , , , , , , , , NEARLY_TWO, NEVER_PLAYED] = TABLES;
const levelTwo = playedFor(1800);

test("a Collection Tier kept stays once a table leaves the visible set", async () => {
    const plays = Object.fromEntries(TABLES.slice(0, 9).map(game => [game.configId, levelTwo]));
    plays[NEARLY_TWO.configId] = playedFor(1740);
    const fake = await startScenario({ tables: TABLES, profiles: { guest: { plays } } });
    fake.advanceTime(ONE_TOAST_MS);

    await play(fake, NEARLY_TWO, MINUTE);
    fake.advanceTime(ONE_TOAST_MS);
    assert.deepEqual(collectionToasts(fake), ["2 | COLLECTION MASTERY | Tier 2: Apprentice | 10 tables at Apprentice or above | New frame: Steam and Gears"]);

    // Ten tables left, nine of them at level 2: the tables now reach tier 0.
    fake.setTables(TABLES.map(game => (game === LEAVING ? { ...game, isHidden: true } : game)));
    // Its first Play brings the tables back to tier 1, still below the kept tier.
    await play(fake, NEVER_PLAYED, MINUTE);
    fake.advanceTime(ONE_TOAST_MS);

    assert.equal(collectionToasts(fake).length, 1, "no lower tier is announced");
    assert.equal(savedCollectionTier(fake, "guest"), 2);
    assert.deepEqual(errorLines(fake), []);
});
