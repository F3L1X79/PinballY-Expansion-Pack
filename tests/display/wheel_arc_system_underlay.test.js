// ============================================================
// Wheel Arc, through main.js on the fake PinballY globals, when the table
// selected at startup belongs to a system with its own underlay: that
// underlay stays on screen from the start.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";

const GAME = { id: 1, configId: "mm", title: "Medieval Madness", system: { mediaDir: "Visual Pinball X" } };

test("a system's underlay for the table selected at startup is not covered by the Wheel Arc", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 8, 20, 0, 0) });
    fake.setTables([GAME]);
    fake.addFile("C:\\PinballY\\Scripts\\ExpansionPack\\assets\\images\\wheel_arc.png");
    fake.addFile("C:\\PinballY\\Assets\\Images\\underlay.png");
    fake.addFile("C:\\PinballY\\Media\\System Underlays\\Visual Pinball X.png");
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "wheelArc";

    await import("../../main.js");
    await settle();

    assert.equal(fake.underlay(), null);
});
