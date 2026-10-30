// ============================================================
// A disabled line in a Drawn Menu, through main.js on the fake PinballY
// globals: dimmed, its reason in smaller type under its label, the menu
// taller by its reason; the cursor rests on it, its outline as tall as the
// line, and Select on it runs no command and leaves the menu open.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { computeGeometry, DRAWN_MENU_LOOK, DRAWN_MENU_Z_INDEX, ROW_KIND } from "../../common/drawn_menu/drawn_menu_painter.js";
import { DRAWN_MENU_IMAGES } from "../../common/drawn_menu/drawn_menu_images.js";
import { readDrawnMenu, drawnRowBoxes, highlightedEntry, isDrawnMenuShown, press } from "./drawn_menu_reader.js";

const MENU_ID = "expansionPack.disabledLine";
const GO = 4500;
const LOCKED = 4501;
const AFTER = 4502;

const fake = createFakePinballYHost({ now: new Date(2026, 9, 29, 20, 0, 0) });
const heardCommands = [];
let getDrawnMenus;
let items;
let closes = 0;

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "drawnMenus";
    config.language = "en";
    await import("../../main.js");
    await settle();
    fake.advanceTime(5000);
    ({ getDrawnMenus } = await import("../../common/drawn_menu/drawn_menu.js"));
    globalThis.mainWindow.on("command", ev => { heardCommands.push(ev.id); });
    items = [
        { title: "Go", cmd: GO },
        { title: "Locked", cmd: LOCKED, disabled: true, reason: "Not today" },
        { title: "After", cmd: AFTER },
        { title: "Cancel", cmd: globalThis.command.MenuReturn },
    ];
});

test("the disabled line is drawn dimmed, its reason under its label", () => {
    getDrawnMenus().show(MENU_ID, items, { onClose: () => { closes++; } });
    fake.advanceTime(500);

    assert.ok(isDrawnMenuShown(fake));
    assert.deepEqual(readDrawnMenu(fake).rows, [
        { kind: "entry", title: "Go", mark: null },
        { kind: "entry", title: "Locked", mark: null, reason: "Not today" },
        { kind: "entry", title: "After", mark: null },
        { kind: "entry", title: "Cancel", mark: null },
    ]);
    const boxes = drawnRowBoxes(fake);
    const label = boxes.find(box => box.title === "Locked");
    const reason = boxes.find(box => box.title === "Not today");
    const after = boxes.find(box => box.title === "After");
    assert.equal(label.color, DRAWN_MENU_LOOK.colors.disabledEntry);
    assert.equal(reason.kind, "reason");
    assert.ok(reason.size < label.size, "the reason in smaller type");
    assert.ok(reason.top >= label.bottom - 0.5, "the reason under the label");
    assert.ok(after.top >= reason.bottom - 0.5, "the next line under the reason");
});

test("the menu is taller by the disabled line's reason", () => {
    const WINDOW = { width: 1080, height: 1920 };
    const entry = title => ({ kind: ROW_KIND.ENTRY, title, disabled: false, reason: null });
    const plain = { title: null, message: null, rows: [entry("Go"), entry("Locked"), entry("After")] };
    const withDisabled = { ...plain, rows: [entry("Go"), { ...entry("Locked"), disabled: true, reason: "Not today" }, entry("After")] };
    const noMessage = () => 0;
    const plainGeometry = computeGeometry(WINDOW, plain, noMessage);
    const geometry = computeGeometry(WINDOW, withDisabled, noMessage);

    const extra = DRAWN_MENU_LOOK.reason.height * geometry.k;
    assert.ok(Math.abs(geometry.rowsHeight - plainGeometry.rowsHeight - extra) < 1e-6);
    assert.ok(Math.abs(geometry.panel.height - plainGeometry.panel.height - extra) < 1e-6);
});

test("the cursor moves onto the disabled line and past it", () => {
    press(fake, "Next");
    assert.equal(highlightedEntry(fake), "Locked");
    press(fake, "Next");
    assert.equal(highlightedEntry(fake), "After");
    press(fake, "Prev");
    assert.equal(highlightedEntry(fake), "Locked");
});

test("on the disabled line, the outline is as tall as the label and its reason", () => {
    const outlineHeight = () => {
        // Past the glide, the outline on its entry.
        fake.advanceTime(500);
        return fake.drawingLayers().find(layer => layer.zIndex === DRAWN_MENU_Z_INDEX.selection).scale().ySpan;
    };
    const lockedHeight = outlineHeight();
    press(fake, "Next");
    const afterHeight = outlineHeight();
    press(fake, "Prev");
    assert.equal(outlineHeight(), lockedHeight);

    const { selection } = DRAWN_MENU_IMAGES;
    const expectedRatio = (selection.height + DRAWN_MENU_LOOK.reason.height) / selection.height;
    assert.ok(Math.abs(lockedHeight / afterHeight - expectedRatio) < 1e-6, `${lockedHeight / afterHeight} vs ${expectedRatio}`);
});

test("Select on the disabled line runs no command and leaves the menu open", () => {
    const heardBefore = heardCommands.length;
    const ev = press(fake, "Select");

    assert.ok(ev.defaultPrevented, "the press is swallowed");
    assert.deepEqual(heardCommands.slice(heardBefore), []);
    assert.ok(isDrawnMenuShown(fake));
    assert.equal(highlightedEntry(fake), "Locked");
    assert.equal(closes, 0);
});

test("the other lines still run their command", () => {
    press(fake, "Next");
    press(fake, "Select");

    assert.equal(heardCommands.at(-1), AFTER);
    assert.ok(!isDrawnMenuShown(fake));
    assert.equal(closes, 1);
});

test("no error is logged", () => {
    assertNoErrorLogged(fake);
});
