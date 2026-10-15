// ============================================================
// The maintainer's open_spec_tickets.mjs on a throwaway git repository
// and a fake gh: a ticket closed by a commit not pushed yet is left out
// of what remains, whether the work sits on main or on a branch. Never
// loaded by PinballY.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SCRIPT = resolve("maintainer/specs/open_spec_tickets.mjs");
// Run from a pre-commit hook, git exports GIT_INDEX_FILE (absolute in a
// worktree) and the like: inherited, they would point the throwaway
// repository's git at the real one.
const OUTSIDE_GIT_ENV = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith("GIT_")));
const ticket = (number, title) => ({ number, title, labels: [], body: `## Parent\n\n#216\n\n## What to build\n\n${title}` });

// A repository whose origin/main stops before a commit closing #217,
// gh listing #217 and #218 as open tickets of spec #216.
function repositoryAhead() {
    const folder = mkdtempSync(join(tmpdir(), "open-spec-tickets-"));
    const git = (...args) => execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", ...args], { cwd: folder, encoding: "utf8", env: OUTSIDE_GIT_ENV });
    git("init", "-q", "-b", "main");
    git("commit", "-q", "--allow-empty", "-m", "Start");
    git("update-ref", "refs/remotes/origin/main", "HEAD");
    git("commit", "-q", "--allow-empty", "-m", "First ticket\n\nCloses #217");
    const bin = join(folder, ".bin");
    execFileSync("mkdir", [bin]);
    writeFileSync(join(folder, ".bin", "issues.json"), JSON.stringify([ticket(217, "First ticket"), ticket(218, "Second ticket")]));
    writeFileSync(join(bin, "gh"), `#!/bin/sh\ncat "${join(bin, "issues.json")}"\n`);
    chmodSync(join(bin, "gh"), 0o755);
    const run = () => execFileSync("node", [SCRIPT, "216"], { cwd: folder, encoding: "utf8", env: { ...OUTSIDE_GIT_ENV, PATH: `${bin}:${process.env.PATH}` } });
    return { git, run };
}

test("on main, a ticket closed by a commit not pushed yet is not left to do", () => {
    const { run } = repositoryAhead();

    assert.equal(run(), [
        "Closed by a commit of this branch, not pushed yet: #217",
        "Still to do for #216:",
        "  #218 Second ticket",
        "The commit that closes #218 carries \"Closes #216\" too.",
        "",
    ].join("\n"));
});

test("on a branch, the tickets its commits close are not left to do", () => {
    const { git, run } = repositoryAhead();
    git("checkout", "-q", "-b", "feature");
    git("commit", "-q", "--allow-empty", "-m", "Second ticket\n\nCloses #218");

    assert.equal(run(), [
        "Closed by a commit of this branch, not pushed yet: #217, #218",
        "No ticket of #216 left: the next commit carries \"Closes #216\".",
        "",
    ].join("\n"));
});
