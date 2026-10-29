// ============================================================
// The ticket /implement next takes: the lowest open issue that is not a
// spec, not closed by an unpushed commit ("Closes #N"), not ready-for-human
// and not blocked by an unfinished "## Blocked by" ticket. Prints why each
// lower one is skipped, then the owner's comments on the chosen ticket.
// Run: node maintainer/specs/next_ticket.mjs (gh CLI; never loaded by PinballY).
// - The owner's comments may redirect to another spec: the agent reads them, the script does not.
// ============================================================

import { execFileSync } from "node:child_process";

const REPOSITORY = "F3L1X79/PinballY-Expansion-Pack";
const OWNER = "F3L1X79";
const CLOSING_PATTERN = /\b(?:closes|fixes|resolves)\s+#(\d+)/gi;
const PARENT_PATTERN = /##\s*Parent\s+#(\d+)/;
const BLOCKED_BY_SECTION = /##\s*Blocked by\s*\n([\s\S]*?)(?=\n##\s|$)/;

// Every issue with its body and comments is well over execFileSync's default 1 MB.
const run = (command, args) => execFileSync(command, args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });

const hasRef = (ref) => {
    try {
        run("git", ["rev-parse", "--verify", "--quiet", ref]);
        return true;
    } catch {
        return false;
    }
};

// Every issue, open and closed: a spec is known by its tickets, closed ones included.
const issues = JSON.parse(run("gh", [
    "issue", "list", "--repo", REPOSITORY, "--state", "all", "--limit", "1000",
    "--json", "number,title,state,labels,body,comments",
]));
const base = hasRef("refs/remotes/origin/main") ? "origin/main" : "main";
const closedOnBranch = new Set([...run("git", ["log", `${base}..HEAD`, "--format=%B"]).matchAll(CLOSING_PATTERN)]
    .map(match => Number(match[1])));

const specs = new Set(issues.map(issue => PARENT_PATTERN.exec(issue.body ?? "")).filter(Boolean).map(match => Number(match[1])));
const isDone = number => closedOnBranch.has(number) || issues.some(issue => issue.number === number && issue.state === "CLOSED");
const blockersLeft = issue => {
    const section = BLOCKED_BY_SECTION.exec(issue.body ?? "");
    if (!section) return [];
    return [...section[1].matchAll(/#(\d+)/g)].map(match => Number(match[1])).filter(number => !isDone(number));
};

// The reason an open issue is not the next ticket, or null when it is one.
function skipReason(issue) {
    if (specs.has(issue.number)) return "spec";
    if (closedOnBranch.has(issue.number)) return "closed by a commit not pushed yet";
    if (issue.labels.some(label => label.name === "ready-for-human")) return "ready-for-human";
    const blockers = blockersLeft(issue);
    if (blockers.length > 0) return `blocked by ${blockers.map(number => `#${number}`).join(", ")}`;
    return null;
}

const open = issues.filter(issue => issue.state === "OPEN").sort((a, b) => a.number - b.number);
for (const issue of open) {
    const reason = skipReason(issue);
    if (reason) {
        console.log(`Skipped #${issue.number} (${reason}): ${issue.title}`);
        continue;
    }
    console.log(`Next: #${issue.number} ${issue.title}`);
    const ownerComments = issue.comments.filter(comment => comment.author && comment.author.login === OWNER);
    if (ownerComments.length > 0) {
        console.log(`Comments by ${OWNER}, oldest first (they override the body and may send you elsewhere):`);
        for (const comment of ownerComments) console.log(`  - ${comment.body.replace(/\s*\n\s*/g, " ")}`);
    }
    process.exit(0);
}
console.log("No ticket left for an agent.");
