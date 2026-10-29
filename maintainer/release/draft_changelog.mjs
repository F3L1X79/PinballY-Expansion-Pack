// ============================================================
// Prints the draft of the next CHANGELOG section: a Markdown list of the
// tickets closed ("Closes #N") by the commits since the latest vX.Y.Z tag,
// or by all history before the first one. Writes nothing; uses git and gh.
// Run: node maintainer/release/draft_changelog.mjs
// ============================================================

import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { isNewerPackVersion } from "../../common/core/pack_version.js";

const REPOSITORY = "F3L1X79/PinballY-Expansion-Pack";
// At a line's start: a message may also quote the rule in its prose.
const CLOSING_PATTERN = /^\s*(?:closes|fixes|resolves)\s+#(\d+)/gim;

// The git range since the latest release tag, or "HEAD" (all history)
// when no tag names a Pack Version.
export function commitRange(tags) {
    const latest = tags.filter(tag => /^v\d+\.\d+\.\d+$/.test(tag))
        .reduce((best, tag) => (best === null || isNewerPackVersion(tag, best) ? tag : best), null);
    return latest === null ? "HEAD" : `${latest}..HEAD`;
}

export function closedTicketNumbers(messages) {
    const numbers = new Set(messages.flatMap(message => [...message.matchAll(CLOSING_PATTERN)].map(match => Number(match[1]))));
    return [...numbers].sort((a, b) => a - b);
}

// One "- Title (#N)" line per ticket, ready to paste and edit.
export function changelogDraft(tickets) {
    return tickets.map(({ number, title }) => (title ? `- ${title} (#${number})\n` : `- #${number}\n`)).join("");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const run = (command, args) => execFileSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    const range = commitRange(run("git", ["tag", "--merged", "HEAD"]).split("\n").filter(Boolean));
    // NUL-separated: a commit body has blank lines of its own.
    const messages = run("git", ["log", range, "--format=%B%x00"]).split("\0");
    const numbers = closedTicketNumbers(messages);
    // One gh call for every title rather than one per ticket; open issues
    // too, since a ticket closed by a commit not pushed yet is still open.
    // Past the limit, the oldest tickets would be listed by number only.
    const issues = numbers.length === 0 ? [] : JSON.parse(run("gh", [
        "issue", "list", "--repo", REPOSITORY, "--state", "all", "--limit", "2000", "--json", "number,title",
    ]));
    const titles = new Map(issues.map(issue => [issue.number, issue.title]));
    console.error(`Tickets closed in ${range}: ${numbers.length}`);
    process.stdout.write(changelogDraft(numbers.map(number => ({ number, title: titles.get(number) ?? null }))));
}
