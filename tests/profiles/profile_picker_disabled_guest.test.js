// ============================================================
// Profile picker turned off in addOns, through main.js on the fake
// PinballY globals, with Alice saved as the active Profile: Guest is active
// once startup is done, cabinet.json names Guest, and a game played then
// counts for Guest.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const MEDIEVAL = {
    id: 1, configId: "Medieval Madness", title: "Medieval Madness", manufacturer: "Williams", year: 1997,
    categories: [], playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false,
};

const readJson = (fake, path) => JSON.parse(fake.readFile(path) || "{}");

test("turning the Profile picker off makes Guest the active Profile", async () => {
    const fake = createFakePinballYHost({ tables: [MEDIEVAL] });
    fake.addFolder(`${PROFILES_FOLDER}\\Alice`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = false;
    config.language = "en";

    const { getProfileStore } = await import("../../common/profile_store.js");
    await import("../../main.js");
    await settle();

    assert.equal(getProfileStore().getActiveProfile().isGuest, true);
    assert.equal(readJson(fake, `${PROFILES_FOLDER}\\cabinet.json`).activeProfile, "guest");
    assert.ok(fake.logLines().some(line => line.startsWith("[Startup]") && line.includes("Guest")));

    fake.gameStarted(MEDIEVAL);
    await settle();
    fake.advanceTime(60 * 1000);
    fake.gameOver(MEDIEVAL);
    await settle();

    assert.equal(readJson(fake, `${PROFILES_FOLDER}\\guest\\profile.json`).plays?.[MEDIEVAL.configId]?.count, 1);
    assert.equal(readJson(fake, `${PROFILES_FOLDER}\\Alice\\profile.json`).plays?.[MEDIEVAL.configId], undefined);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
