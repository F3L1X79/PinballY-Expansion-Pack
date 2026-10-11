// ============================================================
// Checks that every menu the pack opens goes through the Drawn Menu
// module: no script but common/drawn_menu/drawn_menu.js calls PinballY's
// showMenu (common/core/pinbally_host.js only passes it on). Reads the files
// only; runs nothing.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const FOLDERS = ["", "addons/", "common/", "achievements/"];
// Only common/ is split into subfolders; the root is read flat so tests/ and
// the other folders stay out.
const RECURSIVE_FOLDERS = ["common/"];
const ALLOWED = ["common/drawn_menu/drawn_menu.js", "common/core/pinbally_host.js"];
const SHOW_MENU_CALL = /\.showMenu\s*\(/;

test("no script but the Drawn Menu module calls showMenu", () => {
    const scripts = FOLDERS.flatMap(folder => readdirSync(ROOT + folder, { recursive: RECURSIVE_FOLDERS.includes(folder) })
        .map(name => name.replace(/\\/g, "/"))
        .filter(name => name.endsWith(".js"))
        .map(name => folder + name));
    const callers = scripts
        .filter(path => !ALLOWED.includes(path))
        .filter(path => SHOW_MENU_CALL.test(readFileSync(ROOT + path, "utf8")));
    assert.deepEqual(callers, []);
});
