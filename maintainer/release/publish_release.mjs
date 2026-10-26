// ============================================================
// Publishes the GitHub release of the Pack Version: refuses a dirty tree or
// a HEAD not tagged vX.Y.Z with it, builds ExpansionPack.zip from the tag
// with git archive, and creates the release with gh. Never loaded by PinballY.
// Run: node maintainer/release/publish_release.mjs (after git tag vX.Y.Z && git push --tags)
// - git archive applies the export-ignore list of .gitattributes: players get only the pack.
// ============================================================

import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const REPOSITORY = "F3L1X79/PinballY-Expansion-Pack";

// The reason not to release, or null when the tree is clean and HEAD
// carries the tag of the Pack Version.
export function releaseRefusal({ status, headTags, packVersion }) {
    const expectedTag = `v${packVersion}`;
    if (status.trim() !== "") return "The working tree has uncommitted changes: commit or stash them first.";
    if (headTags.includes(expectedTag)) return null;
    const versionTags = headTags.filter(tag => /^v\d/.test(tag));
    if (versionTags.length === 0) return `No tag ${expectedTag} on HEAD: run git tag ${expectedTag} first, or check out the commit that has it.`;
    return `HEAD is tagged ${versionTags.join(", ")}, but the Pack Version is ${packVersion} (common/core/pack_version.js).`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const run = (command, args) => execFileSync(command, args, { encoding: "utf8" });
    // The Pack Version of the repository being released, run from its root.
    const { PACK_VERSION } = await import(pathToFileURL(resolve("common/core/pack_version.js")).href);
    const refusal = releaseRefusal({
        status: run("git", ["status", "--porcelain"]),
        headTags: run("git", ["tag", "--points-at", "HEAD"]).split("\n").filter(Boolean),
        packVersion: PACK_VERSION,
    });
    if (refusal) {
        console.error(refusal);
        process.exit(1);
    }
    const tag = `v${PACK_VERSION}`;
    const zip = join(mkdtempSync(join(tmpdir(), "expansion-pack-release-")), "ExpansionPack.zip");
    run("git", ["archive", "--format=zip", "--prefix=ExpansionPack/", "-o", zip, tag]);
    // --verify-tag: gh would otherwise create a tag the remote doesn't have yet.
    run("gh", ["release", "create", tag, zip, "--repo", REPOSITORY, "--verify-tag", "--title", `Expansion Pack ${tag}`, "--generate-notes"]);
    console.log(`Released ${tag} with ${zip}.`);
}
