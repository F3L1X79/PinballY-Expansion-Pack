// ============================================================
// The launch Loader and its gold text through main.js with the Seamless
// Launch Overlay: centred under the menus while the table loads and closes
// (Exit Game, on its own, after a capture), gone with the overlay;
// PinballY's own message is cancelled; no button taken.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readLoader, loaderLayerCount, readLoaderCaption, assertGoldCaption, assertCaptionBeneathComet } from "../support/loader_reader.js";

const TABLE = { configId: "afm", title: "Attack from Mars" };
const LOADER_HEIGHT = 0.07;
const fake = createFakePinballYHost({ now: new Date(2026, 9, 17, 20, 0, 0), tables: [TABLE] });
const game = fake.getAllTables()[0];
// The overlay messages PinballY was left to write itself.
const messagesNotCancelled = [];

// A button pressed while the comet turns: none of the pack's listeners takes it.
function assertButtonsPassThrough() {
    assert.equal(fake.fire("keydown", { key: "Enter", code: "Enter", repeat: false }).defaultPrevented, false, "a key goes through");
    assert.equal(fake.fire("command", { id: fake.getBuiltInCommand("PlayGame") }).defaultPrevented, false, "a command goes through");
}

// The comet and the words beneath it, centred together as one block, under the menus.
function assertCometAndText(words) {
    const loader = readLoader(fake);
    assert.equal(loader.shown, true, "the comet turns");
    assert.equal(loader.zIndex, 5999, "the comet is just under the menus");
    assert.deepEqual(loader.scale, { ySpan: LOADER_HEIGHT }, "7 % high");
    const launchText = readLoaderCaption(fake);
    assertGoldCaption(launchText, words);
    assert.ok(launchText.zIndex < 6000, "under the menus");
    assertCaptionBeneathComet(loader, launchText);
    const cometTop = loader.position.y + LOADER_HEIGHT / 2;
    const textBottom = launchText.position.y - launchText.scale.ySpan / 2;
    assert.ok(Math.abs(cometTop + textBottom) < 1e-9, "comet and words centred together");
}

function assertNothingShown() {
    assert.deepEqual(readLoader(fake), { shown: false }, "no comet");
    assert.equal(loaderLayerCount(fake), 0, "no Loader layer left");
    assert.equal(readLoaderCaption(fake), null, "no words");
    assert.equal(fake.drawingLayers().length, layersBeforeLaunch, "no launch layer left");
}

let layersBeforeLaunch = 0;

test("the loading words show beneath the comet from the overlay's show until the game plays, the closing ones while the table closes", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "seamlessLaunchOverlay";
    await import("../../main.js");
    await settle();
    fake.on("launchoverlaymessage", ev => { if (!ev.defaultPrevented) messagesNotCancelled.push(ev.id); });
    assert.equal(loaderLayerCount(fake), 0, "no Loader layer before a launch");
    layersBeforeLaunch = fake.drawingLayers().length;

    fake.playGame(game);
    assertCometAndText("Loading…");
    assert.equal(fake.wheelShown(), false, "the wheel is hidden");
    assertButtonsPassThrough();

    fake.gameStarted(game);
    assertNothingShown();

    // The fake host cannot remove a listener: this one records during this test only.
    const messagesAfterExit = [];
    let recordingExit = true;
    fake.on("launchoverlaymessage", ev => { if (recordingExit) messagesAfterExit.push(ev.id); });
    fake.runCommand(fake.getBuiltInCommand("KillGame"));
    assertCometAndText("Returning to tables…");
    assertButtonsPassThrough();
    const wordsLayer = () => fake.drawingLayers().find(layer => layer.strokes().some(stroke => "text" in stroke));
    const layerAtExit = wordsLayer();
    let checkedAtGameOver = false;
    fake.one("gameover", () => {
        assertCometAndText("Returning to tables…");
        assert.equal(wordsLayer(), layerAtExit, "the same words' layer, never removed");
        checkedAtGameOver = true;
    });
    let checkedAfterRunAfter = false;
    fake.one("runafterpost", () => {
        assertCometAndText("Returning to tables…");
        checkedAfterRunAfter = true;
    });
    fake.gameOver(game);
    assert.ok(checkedAtGameOver, "still there when the game is over");
    assert.ok(checkedAfterRunAfter, "still there once the Run After step is done");
    recordingExit = false;
    assert.ok(!messagesAfterExit.includes("gameover"), "PinballY skips its game-over message after Exit Game");
    assertNothingShown();
    assert.equal(fake.wheelShown(), true, "the wheel is back");
    assert.deepEqual(messagesNotCancelled, [], "every PinballY message is cancelled");
    assertNoErrorLogged(fake);
});

test("a table that closes on its own shows the closing words beneath the comet from its game-over message until the overlay goes", () => {
    fake.playGame(game);
    fake.gameStarted(game);
    assertNothingShown();
    let checkedAtGameOver = false;
    fake.one("gameover", () => {
        assertCometAndText("Returning to tables…");
        assertButtonsPassThrough();
        checkedAtGameOver = true;
    });
    let checkedAfterRunAfter = false;
    fake.one("runafterpost", () => {
        assertCometAndText("Returning to tables…");
        checkedAfterRunAfter = true;
    });
    fake.gameOver(game);
    assert.ok(checkedAtGameOver, "shown once the game is over");
    assert.ok(checkedAfterRunAfter, "still there once the Run After step is done");
    assertNothingShown();
    assert.equal(fake.wheelShown(), true, "the wheel is back");
    assert.deepEqual(messagesNotCancelled, [], "every PinballY message is cancelled");
    assertNoErrorLogged(fake);
});

test("a launch that never plays keeps the comet and the loading words until the overlay goes, and its second hide changes nothing", () => {
    fake.playGame(game);
    let checkedAtError = false;
    fake.one("launcherror", () => {
        assertCometAndText("Loading…");
        checkedAtError = true;
    });
    const afterEachHide = [];
    fake.on("launchoverlayhide", () => afterEachHide.push({ layers: fake.drawingLayers().length, wheelShown: fake.wheelShown() }));
    fake.launchError(game);
    assert.ok(checkedAtError);
    assertNothingShown();
    assert.deepEqual(afterEachHide, [
        { layers: layersBeforeLaunch, wheelShown: true },
        { layers: layersBeforeLaunch, wheelShown: true },
    ]);
    assert.deepEqual(messagesNotCancelled, [], "every PinballY message is cancelled");
    assertNoErrorLogged(fake);
});

test("a media capture shows the capture words beneath the comet, then the closing ones while PinballY closes the game", () => {
    fake.playGame(game);
    fake.gameStarted(game, { capture: "single" });
    assertCometAndText("Capturing…");
    assertButtonsPassThrough();
    let checkedAtGameOver = false;
    fake.one("gameover", () => {
        assertCometAndText("Returning to tables…");
        checkedAtGameOver = true;
    });
    fake.gameOver(game);
    assert.ok(checkedAtGameOver, "the closing words once the capture's game is over");
    assertNothingShown();
    assert.deepEqual(messagesNotCancelled, [], "every PinballY message is cancelled");
    assertNoErrorLogged(fake);
});
