// ============================================================
// A Child Profile's Player Level on the drawn Profile Stats' card, through
// main.js on the fake PinballY globals, in a collection with Adult Tables:
// with the same Notified Achievements as an adult, the child's points are
// scaled up, an adult and Guest keep their own points, and a Profile Reset
// starts the child's scaled level over.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { start, MEDIEVAL, MARS, PLAYBOY, PARTY_NIGHT, KEPT_FROM_CHILD_POINTS } from "../levels/child_player_level_scenario.js";

test("with Adult Tables, a child gets more points than an adult for the same Notified Achievements", async () => {
    const { fake, levelOf, worthOf, pointsOf, profileStore } = await start([MEDIEVAL, MARS, PLAYBOY, PARTY_NIGHT]);

    assert.deepEqual(levelOf("Alice"), { level: "2", current: "Actuel : 50 / 125" });
    assert.deepEqual(levelOf("guest"), { level: "2", current: "Actuel : 50 / 125" }, "Guest is not a child");
    const adultWorth = worthOf("Alice");
    const childWorth = worthOf("Kid");
    assert.ok(adultWorth > childWorth + KEPT_FROM_CHILD_POINTS, "the Adult Tables add to the adult's set");
    const child = levelOf("Kid");
    assert.equal(pointsOf(child), Math.floor(50 * adultWorth / childWorth));
    assert.ok(Number(child.level) >= 2, "the adult's level at least");

    profileStore.resetProfile("Kid");
    assert.deepEqual(levelOf("Kid"), { level: "1", current: "Actuel : 0 / 50" }, "a Profile Reset starts over");

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
