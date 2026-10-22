// ============================================================
// The Expansion Pack Settings list through main.js, Drawn Menus on: every
// Add-on by name under its group's heading, On / Off as saved in .env.local
// (read again on each opening), the Language line; Exit goes back to the
// Operator Menu, attract mode closes the list.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { isDrawnMenuShown, drawnMenuLines, highlightedEntry, press, chooseEntry, OPEN_OVER_MS } from "../drawn_menu/drawn_menu_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const ENV_LOCAL = "C:\\PinballY\\Scripts\\ExpansionPack\\.env.local";
const fake = createFakePinballYHost({ now: new Date(2026, 9, 22, 20, 0, 0) });

// A row cut by the edge of the scrolling area is drawn fading, a heading
// then read as an entry: rows compare without their brackets.
const unbracketed = line => line.replace(/^\[(.*)\]$/, "$1");

// Every line of the list, which scrolls: the cursor walks down to the last
// entry, each view taking over the lines read before from where it overlaps
// them; then back to the first entry.
function wholeList() {
    const lines = drawnMenuLines(fake);
    const first = highlightedEntry(fake);
    for (let guard = 0; ; guard++) {
        if (guard > 100) throw new Error("The list never wraps back to its first entry.");
        press(fake, "Next");
        if (highlightedEntry(fake) === first) return lines;
        const view = drawnMenuLines(fake);
        const offset = lines.findIndex((line, index) => lines.slice(index)
            .every((read, at) => view[at] !== undefined && unbracketed(read) === unbracketed(view[at])));
        if (offset === -1) throw new Error("A view of the list does not overlap the lines before.");
        lines.splice(offset, Infinity, ...view);
    }
}

// The list as saved by default, but for what each test changes.
const listLines = ({ achievements = "On", clock = "On", menuCleanup = "Off", language = "English" } = {}) => [
    "[PLAYERS AND PROGRESS]",
    "Profile picker: On", "Welcome Screen: On", `Achievements: ${achievements}`, "Session stats: On",
    "Challenges: On", "Table Mastery: On", "High Scores: On",
    "[WHEEL SCREEN]",
    "Status line: On", `Clock: ${clock}`, "Wheel Arc: On",
    "[MENUS AND FILTERS]",
    "PinballY translation: On", "Drawn Menus: On", "Menu commands: On", "Hall of Fame: On",
    "Tables to Discover: On", "Hidden Tables: On", "Original Tables: On", `Menu Cleanup: ${menuCleanup}`,
    "[LAUNCHING AND PLAYING A TABLE]",
    "Backglass: On", "Launch overlay: On", "Launch sound: On", "Rating prompt: On", "Table ROMs: On",
    "[DEBUGGING]",
    "Launch events trace: On",
    "---",
    `Language: ${language}`,
    "---",
    "Back",
];

function openList() {
    fake.openOperatorMenu();
    fake.advanceTime(OPEN_OVER_MS);
    chooseEntry(fake, "Expansion Pack Settings");
    fake.advanceTime(OPEN_OVER_MS);
}

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "drawnMenus";
    config.language = "en";
    await import("../../main.js");
    await settle();
});

test("without .env.local, the list shows the defaults, Menu Cleanup off", () => {
    openList();

    assert.equal(fake.currentMenu(), null, "no native menu");
    assert.deepEqual(wholeList(), listLines());
    assert.equal(highlightedEntry(fake), "Profile picker: On", "the cursor skips the heading");
});

test("choosing a line does nothing yet", () => {
    chooseEntry(fake, "Clock: On");

    assert.ok(isDrawnMenuShown(fake), "the list stays");
    assert.equal(highlightedEntry(fake), "Clock: On");
});

test("Exit goes back to the Operator Menu", () => {
    press(fake, "Exit");
    fake.advanceTime(OPEN_OVER_MS);

    assert.ok(drawnMenuLines(fake).includes("PinballY Options"));
    assert.ok(drawnMenuLines(fake).includes("Expansion Pack Settings"));
    press(fake, "Exit");
    assert.ok(!isDrawnMenuShown(fake));
});

test("the list shows .env.local as saved, read again on each opening", () => {
    fake.addFile(ENV_LOCAL, "\uFEFF# My cabinet\r\nADD_ON_ACHIEVEMENTS=false\r\nLANGUAGE=de\r\n");
    openList();
    assert.deepEqual(wholeList(), listLines({ achievements: "Off", language: "Deutsch" }));
    chooseEntry(fake, "Back");
    assert.ok(drawnMenuLines(fake).includes("PinballY Options"), "Back goes back to the Operator Menu too");
    press(fake, "Exit");

    fake.addFile(ENV_LOCAL, "ADD_ON_CLOCK=false\nADD_ON_MENU_CLEANUP=true\nLANGUAGE=pt\n");
    openList();
    assert.deepEqual(wholeList(), listLines({ clock: "Off", menuCleanup: "On", language: "Português" }));
});

test("attract mode closes the list", () => {
    fake.enterAttractMode();

    assert.ok(!isDrawnMenuShown(fake));
    assert.equal(fake.currentMenu(), null);
    assertNoErrorLogged(fake);
});
