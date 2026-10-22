// ============================================================
// A Drawn Menu's long heading among its entries, through main.js on the
// fake PinballY globals: wrapped whole over several lines at the heading's
// size, the entries after it below its last line, scrolled into view.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { drawnMenuLines, drawnRowBoxes, highlightedEntry, openMenu, press } from "./drawn_menu_reader.js";

const MENU_ID = "game setup";
const LONG_HEADING = "Each media type below is captured from the screen while the game runs; "
    + "the whole capture takes about two minutes, and entries marked (!) need the game's own audio settings";
const SHORT_HEADING = "Media";

const fake = createFakePinballYHost({ now: new Date(2026, 9, 22, 20, 0, 0) });
let menuReturn;

const entry = (title, cmd) => ({ title, cmd });

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "drawnMenus";
    await import("../../main.js");
    await settle();
    fake.advanceTime(5000);
    menuReturn = globalThis.command.MenuReturn;
});

const headingBox = title => drawnRowBoxes(fake).find(box => box.kind === "heading" && box.title === title.toUpperCase());

test("a long heading shows whole, over several lines, at the size of a one-line heading", () => {
    openMenu(fake, MENU_ID, [{ title: SHORT_HEADING }, entry("Start", 2001), { title: LONG_HEADING }, entry("Cancel", menuReturn)]);

    assert.deepEqual(drawnMenuLines(fake), [`[${SHORT_HEADING.toUpperCase()}]`, "Start", `[${LONG_HEADING.toUpperCase()}]`, "Cancel"]);
    const short = headingBox(SHORT_HEADING);
    const long = headingBox(LONG_HEADING);
    assert.equal(long.size, short.size, "not shrunk");
    assert.ok(long.bottom - long.top >= 3 * (short.bottom - short.top), `${long.bottom - long.top} px tall`);
    press(fake, "Exit");
});

test("the entries after a wrapped heading start below its last line", () => {
    openMenu(fake, MENU_ID, [{ title: LONG_HEADING }, entry("Image", 2001), entry("Video", 2002), entry("Cancel", menuReturn)]);

    const long = headingBox(LONG_HEADING);
    const entries = drawnRowBoxes(fake).filter(box => box.kind === "entry");
    assert.equal(entries.length, 3);
    for (const box of entries) assert.ok(box.top >= long.bottom, `"${box.title}" at ${box.top}, the heading ending at ${long.bottom}`);
    press(fake, "Exit");
});

test("in a menu that scrolls, the entry below a wrapped heading is scrolled into view", () => {
    const items = Array.from({ length: 30 }, (unused, index) => entry(`Entry ${index + 1}`, 2001 + index));
    items.push({ title: LONG_HEADING }, entry("Last entry", 2100));
    openMenu(fake, MENU_ID, items);
    assert.ok(!drawnMenuLines(fake).includes("Last entry"), "the menu scrolls");

    press(fake, "Prev");

    assert.equal(highlightedEntry(fake), "Last entry");
    const lines = drawnMenuLines(fake);
    assert.deepEqual(lines.slice(-2), [`[${LONG_HEADING.toUpperCase()}]`, "Last entry"]);
    press(fake, "Exit");
});

test("no error is logged", () => {
    assertNoErrorLogged(fake);
});
