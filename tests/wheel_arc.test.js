// ============================================================
// Wheel Arc, through main.js on the fake PinballY globals, on a cabinet
// with only PinballY's own default underlay: the pack's gold arc is shown
// at startup, and replaces PinballY's default each time PinballY goes back
// to it on another table.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";

const PINBALLY_DEFAULT = "C:\\PinballY\\Assets\\Images\\underlay.png";
const WHEEL_ARC = "C:\\PinballY\\Scripts\\ExpansionPack\\assets\\images\\wheel_arc.png";

test("the Wheel Arc takes the place of PinballY's default underlay", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 8, 20, 0, 0) });
    fake.addFile(WHEEL_ARC);
    fake.addFile(PINBALLY_DEFAULT);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "wheelArc";

    await import("../main.js");
    await settle();

    assert.equal(fake.underlay(), WHEEL_ARC, "shown at startup");

    const backToDefault = fake.fire("underlaychange", { filename: PINBALLY_DEFAULT });
    assert.equal(backToDefault.filename, WHEEL_ARC);
    assert.equal(backToDefault.defaultPrevented, false, "PinballY still lays it out");

    const noUnderlayAtAll = fake.fire("underlaychange", { filename: "" });
    assert.equal(noUnderlayAtAll.filename, WHEEL_ARC);
});
