// ============================================================
// Hidden Tables in French, through main.js on the fake PinballY globals:
// the entry reads "Tables masquées", right under Favorites.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { filterPickerSection } from "../support/main_menu_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const TABLES = [{ id: 1, configId: "Table 1", title: "Table 1", manufacturer: "Williams", year: 1990, isHidden: true }];

test("the French entry reads Tables masquées", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 18, 20, 0, 0), tables: TABLES });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "hiddenTables";
    config.language = "fr";

    await import("../../main.js");
    await settle();

    assert.deepEqual(filterPickerSection(fake, "Tables masquées"), ["All Tables", "Favorites", "Tables masquées"]);
    assertNoErrorLogged(fake);
});
