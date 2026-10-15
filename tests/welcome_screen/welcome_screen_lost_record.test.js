// ============================================================
// A Lost Record on the Welcome Screen, through main.js on the fake
// PinballY globals: once Bob, a Child Profile, took the Table Record Alice
// held, Alice's next Welcome Screen tells her so in one line with Bob's
// Avatar, even after a Profile Reset, without changing the halo's
// choices; the line is seen as soon as it shows, so closing the screen at
// once, before its fade ends, still counts and it never comes back.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startLostRecords } from "./lost_records_scenario.js";
import { settle } from "../support/fake_pinbally_host.js";
import { readChoices, press, WELCOME_SCREEN_PAUSE_MS } from "./welcome_screen_reader.js";
import { board, avatarFiles, avatarOf, MEDIEVAL, AFM, FACTORY } from "../high_scores/high_scores_scenario.js";

const ALICE_RECORD = board(["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]);
const BOB_RECORD = board(["BOB", "70000000"], ["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]);

test("Alice's Welcome Screen tells her once that Bob took her Table Record", async () => {
    const scenario = await startLostRecords({
        profiles: { Alice: {}, Bob: { isChild: true } }, active: "Alice", files: avatarFiles("Alice", "Bob"),
    });
    const { fake, setBoard, play, arrive, close, line, lineImages, resetProfile } = scenario;
    setBoard(MEDIEVAL, FACTORY);
    setBoard(AFM, FACTORY);

    await play(MEDIEVAL, { after: ALICE_RECORD });
    await arrive("Bob");
    assert.equal(line(), null, "Bob lost nothing");
    const choicesWithoutLine = readChoices(fake);
    await close();
    await play(MEDIEVAL, { after: BOB_RECORD });
    resetProfile("Alice");

    await arrive("Alice");
    assert.equal(line(), "Bob took your record on Medieval Madness", "a Profile Reset keeps the pending Lost Record");
    assert.deepEqual(lineImages(), [avatarOf("Bob")]);
    assert.deepEqual(readChoices(fake), choicesWithoutLine, "the line adds no choice");
    await close();

    await arrive("Bob");
    await close();
    await arrive("Alice");
    assert.equal(line(), null, "told once");
    await close();
    await play(AFM, { after: ALICE_RECORD });

    await arrive("Bob");
    await close();
    await play(AFM, { after: BOB_RECORD });
    // Closed as soon as it is drawn, before its fade ends.
    scenario.switchTo("Alice");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_PAUSE_MS);
    press(fake, "Exit");
    await settle();
    await arrive("Bob");
    await close();
    await arrive("Alice");
    assert.equal(line(), null, "seen even when closed at once");
    assert.deepEqual(fake.logLines().filter(text => text.includes("ERROR")), []);
});
