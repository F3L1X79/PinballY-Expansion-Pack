// ============================================================
// With PinballY's lower status line option left empty, the status line
// Add-on's table info is all the lower status line shows, through main.js
// on the fake PinballY globals.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";

const NOW = new Date(2026, 9, 1, 20, 0, 0);

const MEDIEVAL = { id: 1, configId: "Medieval Madness", title: "Medieval Madness", manufacturer: "Williams" };
const MARS = { id: 2, configId: "Attack from Mars", title: "Attack from Mars", manufacturer: "Bally" };

test("with the option empty, the lower status line shows only the table info", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: [MEDIEVAL, MARS] });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = key === "statusLineInfo";
    }
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    await import("../../main.js");
    await settle();

    // Medieval Madness is selected: second alphabetically, after Attack from Mars.
    const TEXT = lang.tableInfoStatusLines;
    assert.deepEqual(fake.lowerStatusLine(), [
        TEXT.year(2), TEXT.manufacturer(2), TEXT.playCount(2, 0), TEXT.playTime(2, 0, 0),
    ]);

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
