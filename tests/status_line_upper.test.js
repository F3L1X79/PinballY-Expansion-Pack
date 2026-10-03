// ============================================================
// The upper status line, through main.js on the fake PinballY globals: after
// the player's own messages from PinballY's options, the status line Add-on
// adds a welcome naming the active Profile (Guest by its translated name),
// the table count, how to launch and browse, and a sign-off, in the
// interface language. A Profile switch updates the welcome at once, even
// with a temporary message inserted among the player's messages.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";

const NOW = new Date(2026, 9, 1, 20, 0, 0);
const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";

const MEDIEVAL = { id: 1, configId: "Medieval Madness", title: "Medieval Madness", manufacturer: "Williams" };
const PLAYER_MESSAGES = ["Salle de jeu de la famille", "[Game.Title]"];

test("the upper status line welcomes the active Profile after the player's messages, in the interface language", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: [MEDIEVAL], upperStatusLineMessages: PLAYER_MESSAGES });
    fake.addFile(`${PROFILES_FOLDER}\\Cocodin\\profile.json`, JSON.stringify({ version: 1, plays: {} }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = key === "statusLineInfo";
    }
    config.language = "fr";

    const { getProfileStore } = await import("../common/profile_store.js");
    await import("../main.js");
    await settle();

    const projectMessages = welcome => [
        welcome,
        "[Filter.Count] tables sont disponibles !",
        "Bouton noir pour lancer une table.",
        "Flippers droite/gauche pour passer les tables.",
        "Et surtout, amuse-toi bien ;)",
    ];
    assert.deepEqual(fake.upperStatusLine(), [...PLAYER_MESSAGES, ...projectMessages("Bienvenue, Invité !")],
        "the player's messages first, then Guest welcomed by its translated name");

    getProfileStore().switchTo("Cocodin");
    assert.deepEqual(fake.upperStatusLine(), [...PLAYER_MESSAGES, ...projectMessages("Bienvenue, Cocodin !")],
        "the welcome follows the switch at once");

    // PinballY shows a one-time message just after the current (first) entry.
    fake.showOnUpperStatusLine("Ajouté aux favoris");
    getProfileStore().switchTo("guest");
    assert.deepEqual(fake.upperStatusLine(), [
        PLAYER_MESSAGES[0], "Ajouté aux favoris", PLAYER_MESSAGES[1], ...projectMessages("Bienvenue, Invité !"),
    ], "a temporary message moves the project's messages along, never over the player's messages");

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
