// ============================================================
// The Add-on catalogue: every key of config.addOns sits in exactly one
// group, nothing else does, and every group and Add-on has its text in
// English and French (lang_keys.test.js covers the other languages).
// Reads the modules only; runs nothing.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULTS } from "../../common/core/config.js";
import { ADD_ON_GROUPS } from "../../common/settings/add_on_catalogue.js";
import en from "../../lang/en.js";
import fr from "../../lang/fr.js";

const catalogued = ADD_ON_GROUPS.flatMap(({ addOns }) => addOns);

test("every Add-on of config.addOns has one group, and only they do", () => {
    assert.deepEqual([...catalogued].sort(), Object.keys(DEFAULTS.addOns).sort());
    assert.equal(new Set(catalogued).size, catalogued.length, "no Add-on in two places");
});

for (const [code, texts] of [["en", en], ["fr", fr]]) {
    test(`every group and Add-on has its texts in ${code}: name, When on, When off`, () => {
        const { groups, addOns } = texts.expansionPackSettings;
        for (const { group } of ADD_ON_GROUPS) {
            assert.equal(typeof groups[group], "string", `the "${group}" heading`);
        }
        for (const key of Object.keys(DEFAULTS.addOns)) {
            for (const field of ["name", "whenOn", "whenOff"]) {
                const value = addOns[key] && addOns[key][field];
                assert.ok(typeof value === "string" && value.trim() !== "", `the ${field} text of "${key}"`);
            }
        }
    });
}
