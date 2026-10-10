// ============================================================
// PinballY's own menus in French, through main.js on the fake PinballY
// globals: the texts it builds around a name or a duration (Batch Capture
// ready, game details deletion, a custom window's "Show" command, a
// media type's capture line), the filters the generic "... Tables" rule
// used to mangle, and the "Filter by Last Played" periods. An unknown title
// is logged only when logUntranslatedMenuTitles is on.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";

const ADD_ONS_UNDER_TEST = ["uiTranslation"];
const UNKNOWN_TITLE = "A title no PinballY version has";

test("PinballY's own menus read in French, durations and names included", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 1, 20, 0, 0), tables: [] });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "fr";
    config.logUntranslatedMenuTitles = true;

    await import("../../main.js");
    await settle();

    const shown = titles => {
        fake.openMenu("any", titles.map((title, index) => ({ title, cmd: index + 1 })));
        return fake.currentMenu().items.map(item => item.title);
    };

    assert.deepEqual(shown([
        "Batch Capture is ready to go!  12 game(s) will be included in this process, which will take roughly An hour and 5 minutes.",
        "Do you really want to delete the game details for Medieval Madness?  (This only deletes the bibliographic information, not any game files or media.)",
        "Show Backglass 2",
        "DMD Image: Capture w/Audio",
        "Hidden Tables",
        "Unconfigured Tables",
        "Show Hidden Games",
        "Tables played within:",
        "A week",
        "Never played",
        UNKNOWN_TITLE,
    ]), [
        "La capture par lot est prête ! 12 table(s) seront incluses dans ce processus, qui prendra environ 1 h 05.",
        "Voulez-vous vraiment supprimer les détails de la table Medieval Madness ? (Seules les informations bibliographiques sont supprimées, pas les fichiers de la table ni ses médias.)",
        "Afficher Backglass 2",
        "Image du DMD : Capturer avec audio",
        "Tables masquées",
        "Tables non configurées",
        "Afficher les tables masquées",
        "Tables jouées depuis moins de :",
        "Une semaine",
        "Jamais jouées",
        UNKNOWN_TITLE,
    ]);

    const missingLines = fake.logLines().filter(line => line.includes("[UITranslation] Missing translation"));
    assert.equal(missingLines.length, 1);
    assert.ok(missingLines[0].includes(UNKNOWN_TITLE));
});
