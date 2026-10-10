// ============================================================
// Checks that the scripts PinballY loads (main.js, addons/, common/,
// achievements/, lang/) use no syntax its ChakraCore engine rejects:
// optional chaining ("?.") makes the whole pack fail to load on the
// cabinet, while Node.js runs it fine. Reads the files only; runs nothing.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const FOLDERS = ["addons", "common", "achievements", "lang"];
// "?." before a name, a call or an index; a regex such as /s?./ would be a
// false alarm, none exists yet.
const OPTIONAL_CHAINING = /\?\.(?=[\w$([])/;

const loadedScripts = () => [
    "main.js",
    ...FOLDERS.flatMap(folder => readdirSync(ROOT + folder).filter(name => name.endsWith(".js")).map(name => `${folder}/${name}`)),
];

// Comments may mention the syntax they avoid.
const withoutComments = source => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'\\])\/\/.*$/gm, "$1");

test("no script loaded by PinballY uses optional chaining", () => {
    const offenders = loadedScripts().flatMap(path => withoutComments(readFileSync(ROOT + path, "utf8"))
        .split("\n")
        .map((line, index) => ({ path, line: index + 1, text: line.trim() }))
        .filter(({ text }) => OPTIONAL_CHAINING.test(text)));
    assert.deepEqual(offenders, []);
});

// Without a byte order mark PinballY reads a script as Windows-1252, so a
// UTF-8 "…" shows up as "â€¦" on the cabinet.
test("every script loaded by PinballY with non-ASCII text starts with a UTF-8 byte order mark", () => {
    const offenders = loadedScripts().filter(path => {
        const bytes = readFileSync(ROOT + path);
        const hasBom = bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
        return !hasBom && bytes.some(byte => byte > 0x7F);
    });
    assert.deepEqual(offenders, []);
});
