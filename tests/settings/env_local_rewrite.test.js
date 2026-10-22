// ============================================================
// The one-line rewrite of .env.local: given its text (or none), a
// configuration key path and a value, checks the new text byte for byte,
// and that the override parser reads the new value back. Pure function;
// no PinballY host needed.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { rewriteEnvLine } from "../../common/settings/env_local_rewrite.js";
import { applyEnvOverrides } from "../../common/core/env_overrides.js";
import { DEFAULTS } from "../../common/core/config.js";

test("an existing line takes the new value, the rest of the file kept", () => {
    const text = "# My cabinet\r\nLANGUAGE=fr\r\nADD_ON_ACHIEVEMENTS=true\r\n\r\nADD_ON_CLOCK=false\r\n";
    assert.equal(rewriteEnvLine(text, "addOns.achievements", false),
        "# My cabinet\r\nLANGUAGE=fr\r\nADD_ON_ACHIEVEMENTS=false\r\n\r\nADD_ON_CLOCK=false\r\n");
});

test("every active line of a repeated key takes the new value, spaces and quotes included", () => {
    const text = "LANGUAGE=fr\n  LANGUAGE = \"it\"  \nADD_ON_CLOCK=true\nLANGUAGE=de";
    assert.equal(rewriteEnvLine(text, "language", "pt"), "LANGUAGE=pt\nLANGUAGE=pt\nADD_ON_CLOCK=true\nLANGUAGE=pt");
});

test("a commented line stays as it is, the active line appended at the end", () => {
    assert.equal(rewriteEnvLine("# ADD_ON_CLOCK=true\r\nLANGUAGE=fr\r\n", "addOns.clock", false),
        "# ADD_ON_CLOCK=true\r\nLANGUAGE=fr\r\nADD_ON_CLOCK=false\r\n");
});

test("a key with no line gets one at the end, with the file's own line ending", () => {
    assert.equal(rewriteEnvLine("LANGUAGE=fr\n", "addOns.menuCleanup", true), "LANGUAGE=fr\nADD_ON_MENU_CLEANUP=true\n");
    assert.equal(rewriteEnvLine("LANGUAGE=fr", "addOns.menuCleanup", true), "LANGUAGE=fr\r\nADD_ON_MENU_CLEANUP=true\r\n", "a last line without its ending");
    assert.equal(rewriteEnvLine("", "language", "de"), "LANGUAGE=de\r\n", "an empty file");
});

test("a missing file gives that one line, with Windows line endings", () => {
    assert.equal(rewriteEnvLine(null, "addOns.highScores", false), "ADD_ON_HIGH_SCORES=false\r\n");
});

test("the BOM is kept, on a rewritten first line or before an appended one", () => {
    assert.equal(rewriteEnvLine("\uFEFFLANGUAGE=fr\r\n", "language", "es"), "\uFEFFLANGUAGE=es\r\n");
    assert.equal(rewriteEnvLine("\uFEFF", "language", "es"), "\uFEFFLANGUAGE=es\r\n");
});

test("a key whose name only starts like it is another key", () => {
    const text = "ADD_ON_HIDDEN_TABLES_X=true\r\n";
    assert.equal(rewriteEnvLine(text, "addOns.hiddenTables", false), "ADD_ON_HIDDEN_TABLES_X=true\r\nADD_ON_HIDDEN_TABLES=false\r\n");
});

test("the override parser reads the new value back, the other keys unchanged", () => {
    const text = "\uFEFF# Mine\r\nADD_ON_ACHIEVEMENTS=false\r\n# ADD_ON_CLOCK=false\r\nLANGUAGE=fr\r\nADD_ON_ACHIEVEMENTS=false\r\n";
    const rewritten = rewriteEnvLine(rewriteEnvLine(text, "addOns.achievements", true), "addOns.clock", false);
    const { config, problems } = applyEnvOverrides(DEFAULTS, rewritten);

    assert.deepEqual(problems, []);
    assert.equal(config.addOns.achievements, true);
    assert.equal(config.addOns.clock, false);
    assert.equal(config.language, "fr");
});
