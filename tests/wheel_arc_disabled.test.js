// ============================================================
// Wheel Arc turned off, through main.js on the fake PinballY globals:
// PinballY's default underlay stays, at startup and on every table.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";

const PINBALLY_DEFAULT = "C:\\PinballY\\Assets\\Images\\underlay.png";

test("turned off, the Wheel Arc leaves PinballY's default underlay alone", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 8, 20, 0, 0) });
    fake.addFile(PINBALLY_DEFAULT);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = false;

    await import("../main.js");
    await settle();

    assert.equal(fake.underlay(), null);
    assert.equal(fake.fire("underlaychange", { filename: PINBALLY_DEFAULT }).filename, PINBALLY_DEFAULT);
});
