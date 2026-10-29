// ============================================================
// The maintainer's next_ticket.mjs on a throwaway git repository and a
// fake gh: the ticket /implement next takes, the reasons the lower ones
// are skipped, and the owner's comments shown with it. Never loaded by
// PinballY.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SCRIPT = resolve("maintainer/specs/next_ticket.mjs");
// Run from a pre-commit hook, git exports GIT_INDEX_FILE and the like:
// inherited, they would point the throwaway repository's git at the real one.
const OUTSIDE_GIT_ENV = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith("GIT_")));

const issue = (number, { state = "OPEN", parent, blockedBy, labels = [], comments = [] } = {}) => ({
    number,
    title: `Issue ${number}`,
    state,
    labels: labels.map(name => ({ name })),
    body: [
        parent ? `## Parent\n\n#${parent}\n` : "",
        "## What to build\n\nSomething.\n",
        blockedBy ? `## Blocked by\n\n${blockedBy.map(number => `- #${number}`).join("\n")}\n` : "",
    ].join("\n"),
    comments: comments.map(([login, body]) => ({ author: { login }, body })),
});

// A repository whose origin/main stops before a commit closing #12, and
// a fake gh listing the given issues.
function repository(issues) {
    const folder = mkdtempSync(join(tmpdir(), "next-ticket-"));
    const git = (...args) => execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", ...args], { cwd: folder, encoding: "utf8", env: OUTSIDE_GIT_ENV });
    git("init", "-q", "-b", "main");
    git("commit", "-q", "--allow-empty", "-m", "Start");
    git("update-ref", "refs/remotes/origin/main", "HEAD");
    git("commit", "-q", "--allow-empty", "-m", "Twelve\n\nCloses #12");
    const bin = join(folder, ".bin");
    mkdirSync(bin);
    writeFileSync(join(bin, "issues.json"), JSON.stringify(issues));
    writeFileSync(join(bin, "gh"), `#!/bin/sh\ncat "${join(bin, "issues.json")}"\n`);
    chmodSync(join(bin, "gh"), 0o755);
    return () => execFileSync("node", [SCRIPT], { cwd: folder, encoding: "utf8", env: { ...OUTSIDE_GIT_ENV, PATH: `${bin}:${process.env.PATH}` } });
}

test("specs, tickets closed by an unpushed commit, human and blocked tickets are skipped, each with its reason", () => {
    const run = repository([
        issue(10),
        issue(11, { parent: 10, state: "CLOSED" }),
        issue(12, { parent: 10 }),
        issue(13, { parent: 10, labels: ["ready-for-human"] }),
        issue(14, { parent: 10, blockedBy: [12, 20] }),
        issue(15, { parent: 10, comments: [["F3L1X79", "Do #20 first.\nThen this one."], ["someone", "Me too"]] }),
        issue(20),
    ]);

    assert.equal(run(), [
        "Skipped #10 (spec): Issue 10",
        "Skipped #12 (closed by a commit not pushed yet): Issue 12",
        "Skipped #13 (ready-for-human): Issue 13",
        "Skipped #14 (blocked by #20): Issue 14",
        "Next: #15 Issue 15",
        "Comments by F3L1X79, oldest first (they override the body and may send you elsewhere):",
        "  - Do #20 first. Then this one.",
        "",
    ].join("\n"));
});

test("a ticket whose blockers are closed, on GitHub or by an unpushed commit, is taken", () => {
    const run = repository([
        issue(11, { state: "CLOSED" }),
        issue(12),
        issue(14, { blockedBy: [11, 12] }),
    ]);

    assert.equal(run(), [
        "Skipped #12 (closed by a commit not pushed yet): Issue 12",
        "Next: #14 Issue 14",
        "",
    ].join("\n"));
});

test("with only specs and human tickets open, nothing is left for an agent", () => {
    const run = repository([issue(10), issue(13, { parent: 10, labels: ["ready-for-human"] })]);

    assert.equal(run(), [
        "Skipped #10 (spec): Issue 10",
        "Skipped #13 (ready-for-human): Issue 13",
        "No ticket left for an agent.",
        "",
    ].join("\n"));
});
