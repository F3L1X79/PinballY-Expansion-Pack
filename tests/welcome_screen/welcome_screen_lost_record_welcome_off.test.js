// ============================================================
// Lost Records with the Welcome Screen turned off, through main.js on the
// fake PinballY globals: Bob taking Alice's Table Record shows nothing
// when Alice arrives (no toast, no dialog) and no seen marker is written.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { startHighScores, board, MEDIEVAL, FACTORY } from "../high_scores/high_scores_scenario.js";

test("with the Welcome Screen off, a Lost Record is shown nowhere and never marked seen", async () => {
    const { fake, setBoard, play, switchTo, toasts, saved, showEveryToast } = await startHighScores({
        addOns: ["highScores", "profilePicker"], profiles: { Alice: {}, Bob: {} }, active: "Alice",
    });
    setBoard(MEDIEVAL, FACTORY);

    await play(MEDIEVAL, { after: board(["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]) });
    switchTo("Bob");
    await play(MEDIEVAL, { after: board(["BOB", "70000000"], ["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]) });
    await showEveryToast();
    const toastsBefore = toasts().length;
    switchTo("Alice");
    await settle();
    await showEveryToast();

    // The toast reader also sees the Profile picker's own drawings.
    assert.deepEqual(toasts().slice(toastsBefore).filter(toast => !toast.startsWith("Who's playing?")), [], "no toast");
    assert.equal(saved().lostRecordsSeen, undefined);
    assert.ok(!JSON.stringify(fake.drawingLayers().map(layer => layer.texts())).includes("took your record"), "no line anywhere");
});
