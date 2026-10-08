// ============================================================
// A Child Profile's Player Level on the drawn Profile Stats' card, through
// main.js on the fake PinballY globals, in a collection without Adult
// Tables: the scaling only makes up for Night Owl and Full Moon Night.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { start, MEDIEVAL, MARS, KEPT_FROM_CHILD_POINTS } from "./child_player_level_scenario.js";

test("without Adult Tables, the scaling only makes up for Night Owl and Full Moon Night", async () => {
    const { fake, levelOf, worthOf, pointsOf } = await start([MEDIEVAL, MARS]);

    const adultWorth = worthOf("Alice");
    assert.equal(worthOf("Kid"), adultWorth - KEPT_FROM_CHILD_POINTS);
    assert.equal(pointsOf(levelOf("Kid")), Math.floor(50 * adultWorth / (adultWorth - KEPT_FROM_CHILD_POINTS)));
    assert.deepEqual(levelOf("Alice"), { level: "2", current: "Actuel : 50 / 125" });

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
