// ============================================================
// Checks the header block every .js / .mjs file of the project opens with
// (.claude/rules/commenting.md): between two "// ====" lines, at most 10
// lines, 1 to 5 of description, then 0 to 5 "// - " lines, one per point.
// Reads the files only; runs nothing.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
// The 10 lines at most follow from these two.
const MAX_DESCRIPTION_LINES = 5;
const MAX_POINTS = 5;
const RULE = /^\/\/ ={10,}$/;
const POINT = /^\/\/ - /;

// Every script but those in hidden folders (.git, .claude) and installed packages.
const projectScripts = () => readdirSync(ROOT, { recursive: true })
    .map(name => name.replace(/\\/g, "/"))
    .filter(name => /\.m?js$/.test(name))
    .filter(name => !name.split("/").some(part => part.startsWith(".") || part === "node_modules"));

// What is wrong with the file's header, or null.
function headerProblem(source) {
    const lines = source.replace(/^﻿/, "").split(/\r?\n/);
    if (!RULE.test(lines[0])) return "does not open with a // ==== line";
    const end = lines.findIndex((line, index) => index > 0 && RULE.test(line));
    if (end === -1) return "has no closing // ==== line";
    const body = lines.slice(1, end);
    const firstPoint = body.findIndex(line => POINT.test(line));
    const description = firstPoint === -1 ? body : body.slice(0, firstPoint);
    const points = firstPoint === -1 ? [] : body.slice(firstPoint);
    if (description.length < 1 || description.length > MAX_DESCRIPTION_LINES) return `has ${description.length} description lines, not 1 to ${MAX_DESCRIPTION_LINES}`;
    if (points.length > MAX_POINTS) return `has ${points.length} "// - " lines, over ${MAX_POINTS}`;
    if (!points.every(line => POINT.test(line))) return "has a line after its first \"// - \" that is not one";
    return null;
}

test("the check reads the scripts of every folder", () => {
    const scripts = projectScripts();
    for (const path of ["main.js", "addons/drawn_menus.js", "tests/project/script_headers.test.js", "maintainer/specs/open_spec_tickets.mjs"]) {
        assert.ok(scripts.includes(path), path);
    }
});

test("a header over the limits is caught", () => {
    const header = lines => ["// ============================================================", ...lines, "// ============================================================", ""].join("\n");
    assert.equal(headerProblem(header(["// Does a thing.", "// - A trap."])), null);
    assert.match(headerProblem(header(Array.from({ length: 6 }, () => "// Line."))), /6 description lines/);
    assert.match(headerProblem(header(["// One.", ...Array.from({ length: 6 }, () => "// - Point.")])), /over 5/);
    assert.match(headerProblem(header(["// One.", "// - Point.", "// carried on."])), /not one/);
    assert.match(headerProblem("import x from \"y\";\n"), /does not open/);
});

test("every script opens with a header within the commenting rules", () => {
    const offenders = projectScripts()
        .map(path => ({ path, problem: headerProblem(readFileSync(ROOT + path, "utf8")) }))
        .filter(({ problem }) => problem !== null)
        .map(({ path, problem }) => `${path} ${problem}`);
    assert.deepEqual(offenders, []);
});
