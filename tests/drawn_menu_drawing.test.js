// ============================================================
// How a Drawn Menu is drawn, through main.js on the fake PinballY globals
// with only the Drawn Menus Add-on on: its painted images are drawn ahead
// while the wheel sits idle, then only placed on opening, and every
// layer is shrunk to a dot while hidden; the texts are drawn again only
// when they changed; a line that clearly fits is drawn without being
// measured; each opening's time is logged;
// a menu that fails to draw logs the error and shows natively.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { DRAWN_MENU_Z_INDEX } from "../common/drawn_menu_painter.js";
import { DRAWN_MENU_IMAGES } from "../common/drawn_menu_images.js";
import { isDrawnMenuShown, drawnMenuLines, openMainMenu, press, OPEN_OVER_MS } from "./drawn_menu_reader.js";

const IMAGES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\assets\\images\\drawn_menu";
const DOT = { xSpan: 0.001, ySpan: 0.001 };
const IMAGE_FILES = [
    ...Object.values(DRAWN_MENU_IMAGES.panel), ...Object.values(DRAWN_MENU_IMAGES.glass), DRAWN_MENU_IMAGES.selection,
].map(image => `${IMAGES_FOLDER}\\${image.file}`);

const fake = createFakePinballYHost({ now: new Date(2026, 9, 10, 20, 0, 0) });
const menuLayers = () => fake.drawingLayers().filter(layer => Object.values(DRAWN_MENU_Z_INDEX).includes(layer.zIndex));
const imagesDrawn = () => fake.drawings().flatMap(drawing => drawing.images);

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "drawnMenus";
    await import("../main.js");
    await settle();
});

test("every layer waits hidden, shrunk to a dot", () => {
    assert.ok(menuLayers().length > 0);
    for (const layer of menuLayers()) {
        assert.equal(layer.alpha, 0);
        assert.deepEqual(layer.scale(), DOT);
    }
});

test("the painted images are drawn ahead while the wheel sits idle, then only placed on opening", () => {
    fake.advanceTime(5000);
    assert.deepEqual([...imagesDrawn()].sort(), [...IMAGE_FILES].sort(), "each image drawn once, ahead");

    openMainMenu(fake);

    assert.ok(isDrawnMenuShown(fake));
    assert.equal(imagesDrawn().length, IMAGE_FILES.length, "no image drawn again on opening");
    const shownImages = menuLayers().filter(layer => layer.alpha > 0).flatMap(layer => layer.images());
    for (const file of IMAGE_FILES.filter(path => !path.endsWith("_middle.png"))) {
        assert.ok(shownImages.includes(file), `${file} shown`);
    }
});

test("the opening's time is logged", () => {
    assert.ok(fake.logLines().some(line => /^\[DrawnMenus\] "main" opened in \d+ ms/.test(line)), fake.logLines().join("\n"));
});

test("closed, every layer is hidden and shrunk to a dot again", () => {
    press(fake, "Exit");

    for (const layer of menuLayers()) {
        assert.equal(layer.alpha, 0);
        assert.deepEqual(layer.scale(), DOT);
    }
});

test("reopening the same menu draws its texts no more, a changed one draws them again", () => {
    const textDrawings = () => fake.drawings().filter(drawing => drawing.zIndex === DRAWN_MENU_Z_INDEX.texts).length;
    const before = textDrawings();
    openMainMenu(fake);
    press(fake, "Exit");
    assert.equal(textDrawings(), before);

    fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
    press(fake, "Exit");
    assert.equal(textDrawings(), before + 1);
});

// Counts DirectWrite's measures while the menu with these items opens.
function measuresOnOpening(items) {
    const RealStyledText = globalThis.StyledText;
    let count = 0;
    globalThis.StyledText = class extends RealStyledText {
        measure(width) {
            count++;
            return super.measure(width);
        }
    };
    try {
        fake.openMenu("main", items);
    } finally {
        globalThis.StyledText = RealStyledText;
    }
    fake.advanceTime(OPEN_OVER_MS);
    return count;
}

test("a line that clearly fits is drawn without being measured; only a title that may overflow is, and is cut", () => {
    const LONG_TITLE = "An entry title so long that it can never fit on one line of the panel";
    const shortItems = [{ title: "Play", cmd: globalThis.command.PlayGame }, { title: "Quit", cmd: globalThis.command.Quit, checked: true }];
    measuresOnOpening(shortItems);
    press(fake, "Exit");

    assert.equal(measuresOnOpening([...shortItems, { title: "Flyer", cmd: globalThis.command.Flyer }]), 0);
    assert.deepEqual(drawnMenuLines(fake), ["Play", "Quit", "Flyer"]);
    press(fake, "Exit");

    assert.ok(measuresOnOpening([...shortItems, { title: LONG_TITLE, cmd: globalThis.command.Flyer }]) > 0);
    const cut = drawnMenuLines(fake).at(-1);
    assert.ok(cut.endsWith("…") && LONG_TITLE.startsWith(cut.slice(0, -1).trimEnd()), cut);
    press(fake, "Exit");
});

test("a menu that fails to draw logs the error and shows natively", () => {
    const RealStyledText = globalThis.StyledText;
    globalThis.StyledText = class {
        constructor() { throw new Error("DirectWrite is gone"); }
    };
    try {
        fake.openMainMenu();
    } finally {
        globalThis.StyledText = RealStyledText;
    }

    assert.equal(fake.currentMenu().id, "main", "the native menu shows");
    assert.ok(!isDrawnMenuShown(fake));
    assert.ok(fake.logLines().some(line => line.startsWith("[DrawnMenus] ERROR") && line.includes("DirectWrite is gone")));
    for (const layer of menuLayers()) assert.deepEqual(layer.scale(), DOT);
    assert.ok(!press(fake, "Next").defaultPrevented, "the buttons are left to the native menu");
});
