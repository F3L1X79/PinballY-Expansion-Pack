// ============================================================
// The Challenges Add-on started by main.js on the fake PinballY globals:
// for the active Profile, the week's Challenge is drawn at startup,
// locked in cabinet.json, and the Challenge Card is drawn under the badge;
// a game of at least a minute counts in the Profile's profile.json.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const CARD_Z_INDEX = 4500;
const TABLES = [
    { id: 1, configId: "Medieval Madness", title: "Medieval Madness", manufacturer: "Williams", year: 1997 },
    { id: 2, configId: "Attack from Mars", title: "Attack from Mars", manufacturer: "Bally", year: 1995 },
];

test("the Challenges Add-on draws the week's Challenge, shows the card and counts games", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 10, 0, 0), tables: TABLES });
    fake.addFolder(`${PROFILES_FOLDER}\\Alice`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    // The Profile picker too: without it, main.js makes Guest active.
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["challenges", "profilePicker"].includes(key);
    config.language = "en";

    await import("../../main.js");
    await settle();

    const { challenge } = JSON.parse(fake.readFile(`${PROFILES_FOLDER}\\cabinet.json`));
    assert.equal(challenge.current.week, "2026-09-21");
    // The badge shares the card's Z index; only the card shows the Challenge's title.
    const { default: lang } = await import("../../common/i18n.js");
    const { template, target, param } = challenge.current;
    const title = lang.challenges.titles[template](target, param);
    const card = fake.drawingLayers().find(layer => layer.zIndex === CARD_Z_INDEX && layer.texts().includes(title));
    assert.ok(card && card.alpha > 0, "the Challenge Card is shown");
    assert.ok(card.position().y < 0, "under the Profile badge");

    fake.gameStarted(TABLES[0]);
    fake.advanceTime(2 * 60 * 1000);
    fake.gameOver(TABLES[0]);
    const profile = JSON.parse(fake.readFile(`${PROFILES_FOLDER}\\Alice\\profile.json`));
    assert.deepEqual(profile.challenge.games.map(game => game.configId), ["Medieval Madness"]);

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
