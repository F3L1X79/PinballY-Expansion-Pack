// ============================================================
// The adult category set in .env.local (ADULT_CATEGORY) replaces "NSFW":
// started through main.js on the fake PinballY globals with a Child
// Profile active, the wheel leaves out the tables in that category only.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";

const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const TABLES = [
    { id: 1, configId: "Playboy (Bally 1978)", title: "Playboy", categories: ["Adult"] },
    { id: 2, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", categories: ["NSFW"] },
];

test("the adult category set in .env.local replaces NSFW", async () => {
    const fake = createFakePinballYHost({ tables: TABLES });
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({ version: 1, isChild: true }));
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = key === "profilePicker";
    }
    config.adultCategory = "Adult";

    await import("../../main.js");
    await settle();

    assert.deepEqual(fake.getWheelTables().map(game => game.title), ["Medieval Madness"]);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
