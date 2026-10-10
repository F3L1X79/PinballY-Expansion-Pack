// ============================================================
// The Tables to Discover Add-on turned off in the config, through main.js
// on the fake PinballY globals: no filter, so no main menu entry.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";

test("turning the Tables to Discover off removes its main menu filter", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 6, 20, 0, 0), tables: [] });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "hallOfFame";
    config.language = "fr";

    await import("../../main.js");
    await settle();

    assert.deepEqual(fake.scriptFilters().map(filter => filter.title), ["Tables les plus jouées"]);
});
