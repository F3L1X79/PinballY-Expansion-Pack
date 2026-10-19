// ============================================================
// Lists a spec's tickets still to do: open on GitHub with the spec as
// "## Parent", minus those an unpushed commit closes ("Closes #N"). Tells
// whether the next commit closes the spec too. Uses the gh CLI; never
// loaded by PinballY.
// Run: node maintainer/specs/open_spec_tickets.mjs <spec>
// ============================================================

import { execFileSync } from "node:child_process";

const REPOSITORY = "F3L1X79/PinballY-Expansion-Pack";
const CLOSING_PATTERN = /\b(?:closes|fixes|resolves)\s+#(\d+)/gi;

const spec = Number(process.argv[2]);
if (!Number.isInteger(spec) || spec <= 0) {
    console.error("Usage: node maintainer/specs/open_spec_tickets.mjs <spec issue number>");
    process.exit(1);
}

const run = (command, args) => execFileSync(command, args, { encoding: "utf8" });

const openIssues = JSON.parse(run("gh", [
    "issue", "list", "--repo", REPOSITORY, "--state", "open", "--limit", "200",
    "--search", `"#${spec}" in:body`, "--json", "number,title,labels,body",
]));
const parentPattern = new RegExp(`##\\s*Parent\\s+#${spec}\\b`);
const tickets = openIssues.filter(issue => issue.number !== spec && parentPattern.test(issue.body));

const hasRef = (ref) => {
    try {
        run("git", ["rev-parse", "--verify", "--quiet", ref]);
        return true;
    } catch {
        return false;
    }
};
const base = hasRef("refs/remotes/origin/main") ? "origin/main" : "main";
const closedOnBranch = new Set([...run("git", ["log", `${base}..HEAD`, "--format=%B"]).matchAll(CLOSING_PATTERN)]
    .map(match => Number(match[1])));

const remaining = tickets.filter(ticket => !closedOnBranch.has(ticket.number)).sort((a, b) => a.number - b.number);
const closed = tickets.filter(ticket => closedOnBranch.has(ticket.number)).map(ticket => ticket.number).sort((a, b) => a - b).map(number => `#${number}`);

if (closed.length > 0) console.log(`Closed by a commit of this branch, not pushed yet: ${closed.join(", ")}`);
if (remaining.length === 0) {
    console.log(`No ticket of #${spec} left: ${closedOnBranch.has(spec) ? "already closed by a commit of this branch." : `the next commit carries "Closes #${spec}".`}`);
} else {
    console.log(`Still to do for #${spec}:`);
    for (const ticket of remaining) {
        const labels = ticket.labels.map(label => label.name).join(", ");
        console.log(`  #${ticket.number} ${ticket.title}${labels ? ` [${labels}]` : ""}`);
    }
    if (remaining.length === 1) console.log(`The commit that closes #${remaining[0].number} carries "Closes #${spec}" too.`);
}
