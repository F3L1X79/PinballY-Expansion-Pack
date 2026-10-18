// ============================================================
// The Hidden Tables Add-on turned off in the config, through main.js on
// the fake PinballY globals: no filter, so no main menu entry, even with
// hidden tables.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const TABLES = [{ id: 1, configId: "Table 1", title: "Table 1", manufacturer: "Williams", year: 1990, isHidden: true }];

test("turning Hidden Tables off removes its main menu filter", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 18, 20, 0, 0), tables: TABLES });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "hallOfFame";
    config.language = "en";

    await import("../../main.js");
    await settle();

    assert.deepEqual(fake.scriptFilters().map(filter => filter.title), ["Most Played Tables"]);
    assertNoErrorLogged(fake);
});
