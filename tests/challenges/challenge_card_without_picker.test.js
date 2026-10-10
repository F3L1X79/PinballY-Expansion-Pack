// ============================================================
// The Challenges Add-on started by main.js with the Profile picker off:
// there is no Profile badge, so the Challenge Card sits in the top right
// corner of the wheel screen, without the badge's gap above it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";

const CARD_Z_INDEX = 4500;
const TABLES = [
    { id: 1, configId: "Medieval Madness", title: "Medieval Madness", manufacturer: "Williams", year: 1997 },
    { id: 2, configId: "Attack from Mars", title: "Attack from Mars", manufacturer: "Bally", year: 1995 },
];

test("with the Profile picker off, the Challenge Card sits in the top right corner", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 10, 0, 0), tables: TABLES });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "challenges";
    config.language = "en";

    await import("../../main.js");
    await settle();

    const cards = fake.drawingLayers().filter(layer => layer.zIndex === CARD_Z_INDEX);
    assert.equal(cards.length, 1, "the card alone, no badge");
    assert.ok(cards[0].alpha > 0, "the Challenge Card is shown to Guest");
    assert.deepEqual(cards[0].position(), { x: 0, y: 0, align: "top right" });

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
