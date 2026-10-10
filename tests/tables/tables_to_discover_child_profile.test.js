// ============================================================
// The Tables to Discover filter of a Child Profile, through main.js on the
// fake PinballY globals: no Adult Table among its never played tables.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";

const NOW = new Date(2026, 9, 6, 20, 0, 0);
const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const TABLES_TO_DISCOVER_FULL_FILTER_ID = "User.project.TablesToDiscover";

const table = (id, title, categories) => ({ id, configId: title, title, categories, isHidden: false, isConfigured: true });
const PLAYBOY = table(1, "Playboy", ["NSFW", "Classic"]);
const MEDIEVAL = table(2, "Medieval Madness", ["Fantasy"]);
const MARS = table(3, "Attack from Mars", ["SciFi"]);

test("a Child Profile's Tables to Discover leave out the Adult Tables", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: [PLAYBOY, MEDIEVAL, MARS] });
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Léo" }));
    fake.addFile(`${PROFILES_FOLDER}\\Léo\\profile.json`, JSON.stringify({ version: 1, isChild: true, plays: {} }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = ["tablesToDiscover", "profilePicker"].includes(key);
    }
    config.language = "en";

    await import("../../main.js");
    await settle();

    fake.selectFilter(TABLES_TO_DISCOVER_FULL_FILTER_ID);
    assert.deepEqual(fake.getWheelTables().map(game => game.title), ["Attack from Mars", "Medieval Madness"]);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
