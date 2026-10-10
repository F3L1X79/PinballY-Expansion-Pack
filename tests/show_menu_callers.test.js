// ============================================================
// Checks that every menu the pack opens goes through the Drawn Menu
// module: no script but common/drawn_menu.js calls PinballY's showMenu
// (common/pinbally_host.js only passes it on). Reads the files only; runs
// nothing.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const FOLDERS = ["", "addons/", "common/", "achievements/"];
const ALLOWED = ["common/drawn_menu.js", "common/pinbally_host.js"];
const SHOW_MENU_CALL = /\.showMenu\s*\(/;

test("no script but the Drawn Menu module calls showMenu", () => {
    const scripts = FOLDERS.flatMap(folder => readdirSync(ROOT + folder)
        .filter(name => name.endsWith(".js"))
        .map(name => folder + name));
    const callers = scripts
        .filter(path => !ALLOWED.includes(path))
        .filter(path => SHOW_MENU_CALL.test(readFileSync(ROOT + path, "utf8")));
    assert.deepEqual(callers, []);
});
