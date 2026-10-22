// ============================================================
// The fake host's launch helpers fire every launch event in the order the
// PinballY digest states (docs/pinbally/pinbally-help.md, "Interleaved
// launch order"), with every Add-on of main.js listening.
// - Quoted names are "launchoverlaymessage" ids.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const TABLES = [{ configId: "afm", title: "Attack from Mars" }, { configId: "mm", title: "Medieval Madness" }];
const LAUNCH_EVENTS = [
    "prelaunch", "launchoverlayshow", "launchoverlaymessage", "runbeforepre", "runbefore", "gamestarted",
    "gameover", "launcherror", "runafter", "runafterpost", "launchoverlayhide", "postlaunch",
];
const OPENING = ["prelaunch", "launchoverlayshow", "\"init\"", "runbeforepre", "\"launching\"", "runbefore"];
const CLOSING = ["gameover", "runafter", "\"after\"", "runafterpost", "launchoverlayhide", "postlaunch"];

const fake = createFakePinballYHost({ now: new Date(2026, 9, 22, 20, 0, 0), tables: TABLES });
const game = fake.getAllTables()[0];
let recorded = [];

// The launch events fired since the last call.
function takeRecorded() {
    const events = recorded;
    recorded = [];
    return events;
}

test("a table that closes on its own", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    // Listening before main.js, so the messages are read before an Add-on translates them.
    for (const type of LAUNCH_EVENTS) {
        fake.on(type, ev => {
            recorded.push(type === "launchoverlaymessage" ? `"${ev.id}"` : type);
            if (type === "launchoverlaymessage") {
                assert.equal(typeof ev.hideWheelImage, "boolean");
                assert.equal(ev.message === null, ["init", "after"].includes(ev.id), `"${ev.id}" message`);
            }
        });
    }
    await import("../../main.js");
    await settle();
    takeRecorded();

    fake.playGame(game);
    assert.deepEqual(takeRecorded(), ["prelaunch", "launchoverlayshow", "\"init\""], "during the playGame call");
    fake.gameStarted(game);
    fake.gameOver(game);
    await settle();
    assert.deepEqual(takeRecorded(), [...OPENING.slice(3), "\"running\"", "gamestarted", "\"gameover\"", ...CLOSING]);
    assertNoErrorLogged(fake);
});

test("the PlayGame command launches the wheel's table through the same opening", async () => {
    fake.runCommand(fake.getBuiltInCommand("PlayGame"));
    assert.deepEqual(takeRecorded(), ["prelaunch", "launchoverlayshow", "\"init\""]);
    assert.equal(fake.launches().at(-1).configId, fake.getCurrentTable().configId);
    fake.gameStarted(game);
    fake.gameOver(game);
    await settle();
    takeRecorded();
    assertNoErrorLogged(fake);
});

test("Exit Game while playing says \"terminating\" at once, and skips \"gameover\"", async () => {
    fake.playGame(game);
    fake.gameStarted(game);
    takeRecorded();
    fake.runCommand(fake.getBuiltInCommand("KillGame"));
    assert.deepEqual(takeRecorded(), ["\"terminating\""]);
    fake.gameOver(game);
    await settle();
    assert.deepEqual(takeRecorded(), CLOSING);
    assertNoErrorLogged(fake);
});

test("Exit Game before the table has loaded: \"terminating\" after \"runbefore\", and the table never starts", async () => {
    fake.playGame(game);
    fake.runCommand(fake.getBuiltInCommand("KillGame"));
    fake.gameOver(game);
    await settle();
    assert.deepEqual(takeRecorded(), [...OPENING, "\"terminating\"", ...CLOSING]);
    assertNoErrorLogged(fake);
});

test("a launch failure hides the overlay twice, and neither starts nor closes a game", async () => {
    fake.playGame(game);
    fake.launchError(game);
    await settle();
    assert.deepEqual(takeRecorded(), [...OPENING, "launcherror", "launchoverlayhide", "launchoverlayhide", "postlaunch"]);
    assertNoErrorLogged(fake);
});

test("a single capture says \"capturing\" instead of \"running\", and closes on its own", async () => {
    fake.playGame(game);
    fake.gameStarted(game, { capture: "single" });
    fake.gameOver(game);
    await settle();
    assert.deepEqual(takeRecorded(), [...OPENING, "\"capturing\"", "gamestarted", "\"gameover\"", ...CLOSING]);
    assertNoErrorLogged(fake);
});

test("a batch capture runs each table's whole capture, one after the other", async () => {
    const titles = [];
    fake.on("prelaunch", ev => titles.push(ev.game.title));
    for (const table of fake.getAllTables()) {
        fake.playGame(table);
        fake.gameStarted(table, { capture: "batch" });
        fake.gameOver(table);
    }
    await settle();
    const oneCapture = [...OPENING, "\"capturing\"", "gamestarted", "\"gameover\"", ...CLOSING];
    assert.deepEqual(takeRecorded(), [...oneCapture, ...oneCapture]);
    assert.deepEqual(titles, ["Attack from Mars", "Medieval Madness"]);
    assertNoErrorLogged(fake);
});

test("a capture ending under the pause menu closes the launch, then the pause menu's \"menuclose\" fires", async () => {
    fake.playGame(game);
    fake.gameStarted(game, { capture: "single" });
    fake.openPauseMenu();
    fake.advanceTime(1000);
    await settle();
    takeRecorded();
    fake.on("menuclose", () => recorded.push("menuclose"));
    fake.gameOverUnderPauseMenu(game);
    await settle();
    assert.deepEqual(takeRecorded(), ["\"gameover\"", ...CLOSING, "menuclose"]);
    assertNoErrorLogged(fake);
});
