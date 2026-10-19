// ============================================================
// A Child Profile's Player Level on the drawn Profile Stats' card, through
// main.js on the fake PinballY globals: a child with every Achievement of
// its own set Notified, Young Players included, reaches the same level as
// an adult with every Achievement of its own.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { start, MEDIEVAL, MARS, PLAYBOY, PARTY_NIGHT } from "../levels/child_player_level_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";

test("a child with its whole set Notified reaches the level of an adult with its whole set", async () => {
    const { fake, levelOf } = await start([MEDIEVAL, MARS, PLAYBOY, PARTY_NIGHT]);
    const { getAllAchievements } = await import("../../addons/achievements_engine.js");
    // Written by hand while Guest is active: each Profile's own set, all Notified.
    const notifyAll = (name, isChild) => {
        const notified = getAllAchievements({ profileName: name }).map(achievement => achievement.id);
        fake.addFile(`${PROFILES}\\${name}\\profile.json`, JSON.stringify({ version: 1, plays: {}, notified, isChild }));
        return notified;
    };
    const adultIds = notifyAll("Alice", false);
    const childIds = notifyAll("Kid", true);
    assert.ok(childIds.includes("snackTime") && !adultIds.includes("snackTime"));
    assert.ok(childIds.length < adultIds.length, "the Adult Tables' groups are the adult's alone");

    assert.deepEqual(levelOf("Kid"), levelOf("Alice"));

    assertNoErrorLogged(fake);
});
