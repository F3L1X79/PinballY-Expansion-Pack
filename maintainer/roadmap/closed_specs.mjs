// ============================================================
// Lists the items of the docs/roadmap.html queue whose spec (their first
// "Spec <a …/issues/N>" link) is closed on GitHub: finished work to take
// off the roadmap (see .claude/docs/fin-de-spec.md). Closing a human
// ticket on GitHub triggers no agent, so /implement next runs this first.
// Run: node maintainer/roadmap/closed_specs.mjs (gh CLI; never loaded by PinballY).
// ============================================================

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const REPOSITORY = "F3L1X79/PinballY-Expansion-Pack";
const ITEM_START = /<li\b[^>]*\bclass="item\b[^"]*"[^>]*\bid="([^"]+)"/g;
const SPEC_LINK = /Spec <a href="[^"]*\/issues\/(\d+)">/;

const html = readFileSync("docs/roadmap.html", "utf8");
const queueStart = html.indexOf('<ol class="queue">');
// The queue ends where the next section's banner comment starts.
const queue = html.slice(queueStart, html.indexOf("<!-- =====", queueStart));

const starts = [...queue.matchAll(ITEM_START)];
const items = starts.map((match, index) => {
    const chunk = queue.slice(match.index, index + 1 < starts.length ? starts[index + 1].index : queue.length);
    const spec = SPEC_LINK.exec(chunk);
    const title = /<h3>([\s\S]*?)<\/h3>/.exec(chunk);
    return { id: match[1], title: title ? title[1] : match[1], spec: spec ? Number(spec[1]) : null };
}).filter(item => item.spec !== null);

const closed = new Set(JSON.parse(execFileSync("gh", [
    "issue", "list", "--repo", REPOSITORY, "--state", "closed", "--limit", "1000", "--json", "number",
], { encoding: "utf8" })).map(issue => issue.number));

const finished = items.filter(item => closed.has(item.spec));
if (finished.length === 0) console.log("No roadmap item has a closed spec.");
for (const item of finished) console.log(`Spec #${item.spec} closed: ${item.title} (#${item.id}). Take it off the roadmap.`);
