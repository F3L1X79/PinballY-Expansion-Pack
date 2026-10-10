// ============================================================
// Checks the file layout rule: the root holds main.js as its only script,
// addons/ holds exactly one file per Add-on imported and registered in
// SCRIPTS by main.js, common/ holds no Add-on (no module whose default
// export is a function), and tests/ holds only subfolders. Reads the files
// only; runs nothing.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const ADDONS = fileURLToPath(new URL("../../addons/", import.meta.url));
const COMMON = fileURLToPath(new URL("../../common/", import.meta.url));
const TESTS = fileURLToPath(new URL("../", import.meta.url));
const DEFAULT_FUNCTION_EXPORT = /export\s+default\s+(async\s+)?function\b/;

const jsFilesIn = folder => readdirSync(folder).filter(name => name.endsWith(".js")).sort();

test("main.js is the only script at the root", () => {
    assert.deepEqual(jsFilesIn(ROOT), ["main.js"]);
});

test("every script in addons/ is an Add-on registered in main.js", () => {
    const mainSource = readFileSync(ROOT + "main.js", "utf8");
    const registeredNames = new Set([...mainSource.matchAll(/module:\s*(\w+)\s*\}/g)].map(match => match[1]));
    const registeredAddOns = [...mainSource.matchAll(/import \* as (\w+) from "\.\/addons\/([^"/]+\.js)"/g)]
        .filter(match => registeredNames.has(match[1]))
        .map(match => match[2])
        .sort();

    assert.deepEqual(jsFilesIn(ADDONS), registeredAddOns);
});

test("the common folder contains no Add-on", () => {
    const addOnsInCommon = jsFilesIn(COMMON)
        .filter(name => DEFAULT_FUNCTION_EXPORT.test(readFileSync(COMMON + name, "utf8")));
    assert.deepEqual(addOnsInCommon, []);
});

test("tests/ holds only subfolders, no test file at its root", () => {
    const filesAtRoot = readdirSync(TESTS, { withFileTypes: true })
        .filter(entry => !entry.isDirectory())
        .map(entry => entry.name);
    assert.deepEqual(filesAtRoot, []);
});
