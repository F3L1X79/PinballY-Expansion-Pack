// ============================================================
// The maintainer's publish_release.mjs: its refusals before anything is
// built, then a run on a throwaway git repository with a fake gh, checking
// the zip it uploads. Never loaded by PinballY.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, existsSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { releaseRefusal, changelogSection } from "../../maintainer/release/publish_release.mjs";

const SCRIPT = resolve("maintainer/release/publish_release.mjs");
// Run from a pre-commit hook, git exports GIT_INDEX_FILE and the like:
// inherited, they would point the throwaway repository's git at the real one.
const OUTSIDE_GIT_ENV = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith("GIT_")));

const CHANGELOG = [
    "# Changelog",
    "",
    "Every Pack Version from 1.0.0 on, newest first.",
    "",
    "## v1.1.0 (2026-12-01)",
    "",
    "- Release Highlights in the Pack Update success dialog (#349)",
    "",
    "## v1.0.0 (2026-11-15)",
    "",
    "First public release.",
    "",
    "- Profiles, with their Avatars",
    "",
    "## v0.9.0 (2026-11-01)",
    "",
    "- An older section",
    "",
].join("\n");
const CHANGELOG_0_1_0 = "# Changelog\n\n## v0.1.0 (2026-10-01)\n\n- First trial\n";

test("a clean tree tagged with the Pack Version can be released", () => {
    assert.equal(releaseRefusal({ status: "", headTags: ["v0.1.0"], packVersion: "0.1.0", changelog: CHANGELOG_0_1_0 }), null);
});

test("a dirty tree is refused", () => {
    assert.match(releaseRefusal({ status: " M main.js\n", headTags: ["v0.1.0"], packVersion: "0.1.0", changelog: CHANGELOG_0_1_0 }), /uncommitted changes/);
});

test("a commit without a version tag is refused", () => {
    assert.match(releaseRefusal({ status: "", headTags: [], packVersion: "0.1.0", changelog: CHANGELOG_0_1_0 }), /No tag v0\.1\.0 on HEAD/);
    assert.match(releaseRefusal({ status: "", headTags: ["cabinet-check"], packVersion: "0.1.0", changelog: CHANGELOG_0_1_0 }), /No tag v0\.1\.0 on HEAD/);
});

test("a tag that differs from the Pack Version is refused", () => {
    assert.match(releaseRefusal({ status: "", headTags: ["v0.2.0"], packVersion: "0.1.0", changelog: CHANGELOG_0_1_0 }), /tagged v0\.2\.0, but the Pack Version is 0\.1\.0/);
});

test("a Pack Version without a CHANGELOG section is refused, naming the missing heading", () => {
    assert.match(releaseRefusal({ status: "", headTags: ["v1.2.0"], packVersion: "1.2.0", changelog: CHANGELOG }), /CHANGELOG\.md has no "## v1\.2\.0 \(YYYY-MM-DD\)" section/);
});

test("a missing CHANGELOG is refused like a missing section", () => {
    assert.match(releaseRefusal({ status: "", headTags: ["v1.0.0"], packVersion: "1.0.0", changelog: "" }), /CHANGELOG\.md has no "## v1\.0\.0 \(YYYY-MM-DD\)" section/);
});

test("an empty section is refused like a missing one", () => {
    const changelog = "# Changelog\n\n## v1.1.0 (2026-12-01)\n\n## v1.0.0 (2026-11-15)\n\n- First\n";
    assert.match(releaseRefusal({ status: "", headTags: ["v1.1.0"], packVersion: "1.1.0", changelog }), /no "## v1\.1\.0 \(YYYY-MM-DD\)" section, or it is empty/);
});

test("the notes are the Pack Version's section among several, without the next section's heading", () => {
    assert.equal(changelogSection(CHANGELOG, "1.0.0"), "First public release.\n\n- Profiles, with their Avatars");
    assert.equal(changelogSection(CHANGELOG, "1.1.0"), "- Release Highlights in the Pack Update success dialog (#349)");
    assert.equal(changelogSection(CHANGELOG, "0.9.0"), "- An older section");
});

test("a version is not mistaken for a longer one that starts the same", () => {
    assert.equal(changelogSection("## v1.0.10 (2027-01-01)\n\n- Later\n", "1.0.1"), null);
});

// A repository at Pack Version 0.3.0 with the real .gitattributes, and a
// fake gh outside it that records its arguments and keeps the zip it gets.
function packRepository() {
    const folder = mkdtempSync(join(tmpdir(), "publish-release-"));
    const bin = mkdtempSync(join(tmpdir(), "publish-release-gh-"));
    const git = (...args) => execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", ...args], { cwd: folder, encoding: "utf8", env: OUTSIDE_GIT_ENV });
    const files = {
        "main.js": "// main\n",
        "common/core/pack_version.js": "export const PACK_VERSION = \"0.3.0\";\n",
        "lang/en.js": "// en\n",
        "tests/core/a.test.js": "// test\n",
        "maintainer/specs/a.mjs": "// maintainer\n",
        "docs/adr/0001-a.md": "# ADR\n",
        "docs/images/a.png": "png",
        "GLOSSARY.md": "# Glossary\n",
        "CHANGELOG.md": "# Changelog\n\n## v0.3.0 (2026-10-29)\n\n- Pack Update (#331)\n",
    };
    for (const [path, content] of Object.entries(files)) {
        mkdirSync(dirname(join(folder, path)), { recursive: true });
        writeFileSync(join(folder, path), content);
    }
    copyFileSync(resolve(".gitattributes"), join(folder, ".gitattributes"));
    git("init", "-q", "-b", "main");
    git("add", "-A");
    git("commit", "-q", "-m", "Pack");
    writeFileSync(join(bin, "gh"), [
        "#!/bin/sh",
        `printf '%s\\n' "$@" > "${join(bin, "args.txt")}"`,
        `for argument in "$@"; do case "$argument" in *.zip) cp "$argument" "${join(bin, "uploaded.zip")}";; *.md) cp "$argument" "${join(bin, "notes.md")}";; esac; done`,
        "",
    ].join("\n"));
    chmodSync(join(bin, "gh"), 0o755);
    const run = () => spawnSync("node", [SCRIPT], { cwd: folder, encoding: "utf8", env: { ...OUTSIDE_GIT_ENV, PATH: `${bin}:${process.env.PATH}` } });
    return { folder, bin, git, run };
}

// The entry names of a zip, read from its central directory headers.
function zipEntries(path) {
    const zip = readFileSync(path);
    const names = [];
    for (let offset = zip.indexOf("PK\x01\x02", 0, "latin1"); offset >= 0; offset = zip.indexOf("PK\x01\x02", offset + 46, "latin1")) {
        const nameLength = zip.readUInt16LE(offset + 28);
        names.push(zip.toString("utf8", offset + 46, offset + 46 + nameLength));
    }
    return names;
}

test("a tagged Pack Version is released with ExpansionPack.zip, its files under ExpansionPack/", () => {
    const { bin, git, run } = packRepository();
    git("tag", "v0.3.0");

    const result = run();

    assert.equal(result.status, 0, result.stderr);
    const args = readFileSync(join(bin, "args.txt"), "utf8").split("\n");
    assert.deepEqual(args.slice(0, 3), ["release", "create", "v0.3.0"]);
    assert.ok(args.some(argument => argument.endsWith("/ExpansionPack.zip")), args.join(" "));
    const files = zipEntries(join(bin, "uploaded.zip")).filter(name => !name.endsWith("/"));
    assert.deepEqual(files.sort(), [
        "ExpansionPack/CHANGELOG.md",
        "ExpansionPack/common/core/pack_version.js",
        "ExpansionPack/docs/images/a.png",
        "ExpansionPack/lang/en.js",
        "ExpansionPack/main.js",
    ]);
});

test("the GitHub release's text is the Pack Version's CHANGELOG section, not generated notes", () => {
    const { bin, git, run } = packRepository();
    git("tag", "v0.3.0");

    const result = run();

    assert.equal(result.status, 0, result.stderr);
    const args = readFileSync(join(bin, "args.txt"), "utf8").split("\n");
    assert.ok(args.includes("--notes-file"), args.join(" "));
    assert.equal(args.includes("--generate-notes"), false);
    assert.equal(readFileSync(join(bin, "notes.md"), "utf8"), "- Pack Update (#331)\n");
});

test("a Pack Version missing from the CHANGELOG is refused before anything is uploaded", () => {
    const { folder, bin, git, run } = packRepository();
    writeFileSync(join(folder, "CHANGELOG.md"), "# Changelog\n");
    git("commit", "-q", "-am", "No section");
    git("tag", "v0.3.0");

    const result = run();

    assert.equal(result.status, 1);
    assert.match(result.stderr, /no "## v0\.3\.0 \(YYYY-MM-DD\)" section/);
    assert.equal(existsSync(join(bin, "args.txt")), false);
});

test("a refused release stops before anything is built or uploaded", () => {
    const { folder, bin, git, run } = packRepository();
    git("tag", "v0.2.0");
    writeFileSync(join(folder, "main.js"), "// changed\n");

    const result = run();

    assert.equal(result.status, 1);
    assert.match(result.stderr, /uncommitted changes/);
    assert.equal(existsSync(join(bin, "args.txt")), false);
});

test("a tag that differs from the repository's Pack Version is refused", () => {
    const { bin, git, run } = packRepository();
    git("tag", "v0.2.0");

    const result = run();

    assert.equal(result.status, 1);
    assert.match(result.stderr, /tagged v0\.2\.0, but the Pack Version is 0\.3\.0/);
    assert.equal(existsSync(join(bin, "args.txt")), false);
});
