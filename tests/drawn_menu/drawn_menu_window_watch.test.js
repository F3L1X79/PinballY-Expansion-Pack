// ============================================================
// A Drawn Menu follows the window's size while open: PinballY gives its
// window its final size only after the scripts' init and tells no script,
// so a Dialog opened at startup is redrawn whole and sharp for the new
// size, its selection kept, without fading in again.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { DRAWN_MENU_IMAGES } from "../../common/drawn_menu/drawn_menu_images.js";
import { DRAWN_MENU_Z_INDEX } from "../../common/drawn_menu/drawn_menu_painter.js";
import { shownLayers } from "../support/shown_layers.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { highlightedEntry, press, openMainMenu, OPEN_OVER_MS } from "./drawn_menu_reader.js";

const SMALL = { width: 845, height: 461 };
const LARGE = { width: 2560, height: 1600 };
// Past the watch's period (about 100 ms), well within the fade's length.
const WATCH_OVER_MS = 120;
const IMAGES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\assets\\images\\drawn_menu";
const BUTTONS = ["First answer", "Second answer", "Third answer"];

const fake = createFakePinballYHost({ now: new Date(2026, 9, 10, 20, 0, 0), layoutSize: SMALL });
let wheelDialogs;
let DIALOG_PRIORITY;
let windowSize = SMALL;

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "drawnMenus";
    ({ getWheelDialogs: wheelDialogs, DIALOG_PRIORITY } = await import("../../common/core/wheel_dialog.js"));
    await import("../../main.js");
    await settle();
    fake.advanceTime(5000);
});

function resize(size) {
    windowSize = size;
    fake.setLayoutSize(size);
}

// A shown layer's box in window pixels, and the canvas it was drawn on.
function shownBox(layer) {
    const canvas = layer.canvasSize();
    const height = layer.scale().ySpan * windowSize.height;
    const width = layer.scale().xSpan === undefined ? canvas.width * height / canvas.height : layer.scale().xSpan * windowSize.width;
    return { canvas, width, height };
}

const shownImage = image => fake.drawingLayers().find(layer => layer.alpha > 0 && layer.images().includes(`${IMAGES_FOLDER}\\${image.file}`));

const panelWidths = () => ["top", "middle", "bottom"].map(part => Math.round(shownBox(shownImage(DRAWN_MENU_IMAGES.panel[part])).width));

const textsLayer = () => shownLayers(fake, DRAWN_MENU_Z_INDEX.texts).find(layer => layer.texts().length > 0);

// Drawn at its size, a texts' layer is sharp: shown neither stretched nor shrunk.
function assertSharp(layer, name) {
    const box = shownBox(layer);
    assert.ok(Math.abs(box.height - box.canvas.height) < 1e-6, `${name}: ${box.canvas.height} px drawn, ${box.height} px shown`);
}

async function openDialog() {
    wheelDialogs().submit({
        id: "windowWatchDialog",
        title: "Dialog", message: "A message long enough to wrap over a couple of lines in the panel.",
        buttons: BUTTONS.map(label => ({ label })),
        priority: DIALOG_PRIORITY.UPDATE_PROMPT,
    });
    await settle();
    fake.advanceTime(OPEN_OVER_MS);
}

const firstTextSize = () => textsLayer().strokes().find(stroke => "text" in stroke).size;

// The redraw for a new size: whole, sharp, texts drawn for it.
function assertDrawnForNewSize(smallTextSize) {
    const [top, middle, bottom] = panelWidths();
    assert.equal(middle, top, "the middle as wide as the top");
    assert.equal(bottom, top, "the bottom as wide as the top");
    assertSharp(textsLayer(), "texts");
    assertSharp(shownLayers(fake, DRAWN_MENU_Z_INDEX.selectedText).find(layer => layer.texts().length > 0), "selected text");
    assert.ok(firstTextSize() > smallTextSize, "texts drawn larger for the larger window");
}

const redrawLines = () => fake.logLines().filter(line => line.includes("redrawn for the window's new size"));

let intervalsBeforeDialog;

test("a Dialog opened in the small window is redrawn whole and sharp once the window grows, its selection kept, without fading in again", async () => {
    intervalsBeforeDialog = fake.runningIntervalCount();
    await openDialog();
    press(fake, "Next");
    const smallTextSize = firstTextSize();

    resize(LARGE);
    fake.advanceTime(WATCH_OVER_MS);

    assertDrawnForNewSize(smallTextSize);
    assert.equal(highlightedEntry(fake), BUTTONS[1]);
    const shownMenuLayers = fake.drawingLayers().filter(layer => Object.values(DRAWN_MENU_Z_INDEX).includes(layer.zIndex) && layer.alpha > 0);
    assert.ok(shownMenuLayers.length > 0 && shownMenuLayers.every(layer => layer.alpha === 1), "every layer shown at once, no fade");
});

test("the redraw logs one line naming the menu and both sizes", () => {
    const lines = redrawLines();
    assert.equal(lines.length, 1, lines.join("\n"));
    assert.match(lines[0], /"windowWatchDialog"/);
    assert.match(lines[0], /845x461 to 2560x1600/);
});

test("while the window keeps its size, nothing is redrawn", () => {
    const drawingsBefore = fake.drawings().length;

    fake.advanceTime(2000);

    assert.equal(fake.drawings().length, drawingsBefore);
    assert.equal(redrawLines().length, 1);
});

test("the watch stops when the Dialog closes", async () => {
    press(fake, "Exit");
    await settle();

    assert.equal(fake.runningIntervalCount(), intervalsBeforeDialog, "no timer left running");
});

test("the main menu follows a change of the window's size the same way", () => {
    resize(SMALL);
    openMainMenu(fake);
    const smallTextSize = firstTextSize();

    resize(LARGE);
    fake.advanceTime(WATCH_OVER_MS);

    assertDrawnForNewSize(smallTextSize);
    assert.equal(redrawLines().length, 2);
});

test("no error logged", () => {
    assertNoErrorLogged(fake);
});
