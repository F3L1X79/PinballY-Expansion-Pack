// ============================================================
// The Language page's names: every language file lists the six languages,
// each in its own language, the same in every file and in the same order.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import de from "../../lang/de.js";
import en from "../../lang/en.js";
import es from "../../lang/es.js";
import fr from "../../lang/fr.js";
import it from "../../lang/it.js";
import pt from "../../lang/pt.js";

const OWN_NAMES = { en: "English", fr: "Français", de: "Deutsch", es: "Español", it: "Italiano", pt: "Português" };

for (const [code, texts] of Object.entries({ de, en, es, fr, it, pt })) {
    test(`${code} lists the six languages in their own names, in order`, () => {
        assert.deepEqual(Object.entries(texts.expansionPackSettings.languageNames), Object.entries(OWN_NAMES));
    });
}
