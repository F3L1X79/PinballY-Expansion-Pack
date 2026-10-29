// ============================================================
// The maintainer's draft_changelog.mjs: which commits it reads (since the
// latest vX.Y.Z tag, or all history), which tickets their messages close,
// and the Markdown list it prints. Never loaded by PinballY.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { commitRange, closedTicketNumbers, changelogDraft } from "../../maintainer/release/draft_changelog.mjs";

test("the commits since the latest version tag are read", () => {
    assert.equal(commitRange(["v0.1.0", "v1.2.0", "v1.10.0", "v1.9.3"]), "v1.10.0..HEAD");
});

test("tags that are not a Pack Version are ignored", () => {
    assert.equal(commitRange(["v1.0.0", "cabinet-check", "v2.0.0-beta"]), "v1.0.0..HEAD");
});

test("with no version tag yet, the whole history is read", () => {
    assert.equal(commitRange([]), "HEAD");
    assert.equal(commitRange(["cabinet-check"]), "HEAD");
});

test("only the tickets a commit closes are kept", () => {
    assert.deepEqual(closedTicketNumbers([
        "Roadmap: credits\n\nRefs #340",
        "Dialogs: a gold title\n\nCloses #359\n\nCo-Authored-By: Claude <noreply@anthropic.com>",
        "Docs only",
        "Workflow rule\n\nA finishing commit carries a Closes #12 line.",
    ]), [359]);
});

test("several Closes lines in one commit each count, once, in ticket order", () => {
    assert.deepEqual(closedTicketNumbers([
        "Last ticket of the spec\n\nCloses #360\nCloses #357",
        "Follow-up\n\nCloses #357",
    ]), [357, 360]);
});

test("the draft is a Markdown list of the tickets' titles and numbers", () => {
    assert.equal(changelogDraft([
        { number: 358, title: "Drawn Menus follow the window's size while open" },
        { number: 359, title: "Dialogs: a gold title and a clear message" },
    ]), [
        "- Drawn Menus follow the window's size while open (#358)",
        "- Dialogs: a gold title and a clear message (#359)",
        "",
    ].join("\n"));
});

test("a ticket whose title is unknown is still listed by its number", () => {
    assert.equal(changelogDraft([{ number: 12, title: null }]), "- #12\n");
});

test("no ticket closed gives an empty draft", () => {
    assert.equal(changelogDraft([]), "");
});
