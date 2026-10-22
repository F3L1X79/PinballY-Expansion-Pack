// ============================================================
// The Expansion Pack Settings in French through main.js: "Réglages du pack"
// in the Operator Menu, the list's headings, Add-ons and states, the
// language line in the saved language's own name, and an Add-on's page.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { readDrawnMenu, drawnMenuLines, highlightedEntry, press, chooseEntry, squeezed, OPEN_OVER_MS } from "../drawn_menu/drawn_menu_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const ENV_LOCAL = "C:\\PinballY\\Scripts\\ExpansionPack\\.env.local";

test("the list speaks French", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 22, 20, 0, 0) });
    fake.addFile(ENV_LOCAL, "LANGUAGE=es\r\nADD_ON_PROFILE_PICKER=false\r\n");
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "drawnMenus";
    // Read on i18n's first load, so before main.js.
    config.language = "fr";
    await import("../../main.js");
    await settle();

    fake.openOperatorMenu();
    fake.advanceTime(OPEN_OVER_MS);
    chooseEntry(fake, "Réglages du pack");
    fake.advanceTime(OPEN_OVER_MS);

    assert.deepEqual(drawnMenuLines(fake).slice(0, 4), [
        "[JOUEURS ET PROGRESSION]", "Choix du joueur : Désactivé", "Écran d'accueil : Activé au redémarrage", "Succès : Activé au redémarrage",
    ]);
    chooseEntry(fake, "Langue : Español", "Next");
    assert.equal(highlightedEntry(fake), "Retour", "the language line comes before Retour");
    press(fake, "Select");
    assert.ok(drawnMenuLines(fake).includes("Réglages du pack"), "Retour goes back to the Operator Menu");

    chooseEntry(fake, "Réglages du pack");
    fake.advanceTime(OPEN_OVER_MS);
    chooseEntry(fake, "Choix du joueur : Désactivé");
    fake.advanceTime(OPEN_OVER_MS);
    assert.ok(squeezed(readDrawnMenu(fake).message).startsWith(squeezed("Quand il est activé : « Changer de joueur » dans le menu principal")));
    assert.ok(squeezed(readDrawnMenu(fake).message).includes(squeezed("Quand il est désactivé : Les parties d'Invité comptent")));
    press(fake, "Select");
    assert.deepEqual(drawnMenuLines(fake), ["Choix du joueur : Activé", "Enregistrer", "Annuler"]);
    chooseEntry(fake, "Enregistrer");
    fake.advanceTime(OPEN_OVER_MS);
    assert.equal(highlightedEntry(fake), "Choix du joueur : Activé au redémarrage");
    assert.equal(fake.readFile(ENV_LOCAL), "LANGUAGE=es\r\nADD_ON_PROFILE_PICKER=true\r\n");

    assertNoErrorLogged(fake);
});
