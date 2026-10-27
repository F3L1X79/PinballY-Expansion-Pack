// ============================================================
// The Error Log, through main.js: a script whose init() throws is logged
// and skipped as before, and its error lands in errors.log too, so a script
// that failed to start leaves a trace after PinballY restarted.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { errorLines } from "../support/error_log.js";
import { PACK_VERSION } from "../../common/core/pack_version.js";

const NOW = new Date(2026, 9, 27, 8, 30, 0);
const ERROR_LOG = "C:\\PinballY\\Scripts\\ExpansionPack\\errors.log";

test("a script whose init throws lands in errors.log", async () => {
    const fake = createFakePinballYHost({ now: NOW });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    // The Clock's init creates its layer first: that one call fails.
    const createDrawingLayer = mainWindow.createDrawingLayer;
    let failed = false;
    mainWindow.createDrawingLayer = (...args) => {
        if (failed) return createDrawingLayer(...args);
        failed = true;
        throw new Error("No layer today");
    };
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "clock";
    config.language = "en";
    await import("../../main.js");
    await settle();

    assert.deepEqual(errorLines(fake), ["[Startup] ERROR initializing \"clock\": No layer today"]);
    assert.equal(fake.readFile(ERROR_LOG), `2026-10-27 08:30:00 v${PACK_VERSION} [Startup] ERROR initializing "clock": No layer today\r\n`);
});
