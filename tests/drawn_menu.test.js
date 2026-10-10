// ============================================================
// The main menu as a Drawn Menu, through main.js on the fake PinballY
// globals: it is drawn instead of the native one with the same entries in
// the same order, the cursor on the first entry; Next and Prev move it,
// wrapping, with PinballY's navigation sound, the gold title landing at
// once on the new entry while the outline glides to it; Select or Launch runs the
// entry's command with the Select sound, Exit and attract mode close it
// without running anything, and no button reaches the wheel while it is
// open.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import {
    isDrawnMenuShown, drawnMenuLines, readDrawnMenu, highlightedEntry, press, openMainMenu, chooseEntry, GLIDE_OVER_MS,
} from "./drawn_menu_reader.js";
import { DRAWN_MENU_Z_INDEX } from "../common/drawn_menu_painter.js";

const ADD_ONS_UNDER_TEST = ["uiTranslation", "customMenuCommands", "drawnMenus"];
const BUTTON_SOUNDS = "C:\\PinballY\\Assets\\Button Sounds";
const NEXT_SOUND = `${BUTTON_SOUNDS}\\Next.wav`;
const SELECT_SOUND = `${BUTTON_SOUNDS}\\Select.wav`;
const DESELECT_SOUND = `${BUTTON_SOUNDS}\\Deselect.wav`;
const TABLES = [
    { id: 1, configId: "mm", title: "Medieval Madness", manufacturer: "Williams", year: 1997, isHidden: false },
    { id: 2, configId: "tz", title: "Twilight Zone", manufacturer: "Bally", year: 1993, isHidden: false },
];

const fake = createFakePinballYHost({ now: new Date(2026, 9, 10, 20, 0, 0), tables: TABLES });
let LABELS;

test("setup", async () => {
    for (const path of [NEXT_SOUND, SELECT_SOUND, DESELECT_SOUND]) fake.addFile(path);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";
    const { default: lang } = await import("../common/i18n.js");
    LABELS = lang.customMenuLabels;
    await import("../main.js");
    await settle();
});

test("the main menu is drawn instead of the native one, with the same entries in the same order", () => {
    openMainMenu(fake);

    assert.equal(fake.currentMenu(), null, "no native menu");
    assert.ok(isDrawnMenuShown(fake));
    assert.deepEqual(drawnMenuLines(fake), [
        "Play", LABELS.tableSetup, LABELS.tableOfTheDay, LABELS.tableOfTheWeek, LABELS.randomGame, "---",
        "Information", "Flyer", "High Scores", "Instruction Card", "---",
        "Rate Table", "Add to Favorites", "---",
        "All Tables", "Favorite Tables",
    ]);
    assert.equal(readDrawnMenu(fake).message, null);
    assert.equal(highlightedEntry(fake), "Play", "the cursor opens on the first entry");
});

test("Next and Prev move the cursor over the entries only, wrapping, with the navigation sound", () => {
    const soundsBefore = fake.soundsPlayed().length;
    press(fake, "Prev");
    assert.equal(highlightedEntry(fake), "Favorite Tables", "Prev from the first entry wraps to the last");
    press(fake, "Next");
    assert.equal(highlightedEntry(fake), "Play", "Next from the last entry wraps to the first");
    for (let count = 0; count < 5; count++) press(fake, "Next");
    assert.equal(highlightedEntry(fake), "Information", "the separator is skipped");
    assert.deepEqual(fake.soundsPlayed().slice(soundsBefore), Array(7).fill(NEXT_SOUND));
});

test("the gold title lands at once on the new entry, while only the outline glides", () => {
    const goldLayer = () => fake.drawingLayers().find(layer => layer.zIndex === DRAWN_MENU_Z_INDEX.selectedText);
    const outlineLayer = () => fake.drawingLayers().find(layer => layer.zIndex === DRAWN_MENU_Z_INDEX.selection);
    const outlineBefore = outlineLayer().position();
    fake.fire("commandbuttondown", { command: "Next", repeat: false });
    const goldOnPress = goldLayer().position();
    const outlineOnPress = outlineLayer().position();
    fake.advanceTime(GLIDE_OVER_MS);

    assert.deepEqual(goldOnPress, goldLayer().position(), "the gold title does not move after the press");
    assert.deepEqual(outlineOnPress, outlineBefore, "the outline starts from the previous entry");
    assert.notDeepEqual(outlineLayer().position(), outlineBefore, "then glides to the new one");
    press(fake, "Prev");
});

test("no button reaches the wheel while the menu is open", () => {
    for (const button of ["Next", "Prev", "NextPage", "PrevPage", "Coin1", "Service1"]) {
        assert.ok(press(fake, button).defaultPrevented, button);
    }
    assert.ok(isDrawnMenuShown(fake));
});

test("Exit closes the menu without running anything, with the Deselect sound, and the buttons reach the wheel again", () => {
    const commandsBefore = fake.executedCommands().length;
    const ev = press(fake, "Exit");

    assert.ok(ev.defaultPrevented);
    assert.ok(!isDrawnMenuShown(fake));
    assert.equal(fake.executedCommands().length, commandsBefore);
    assert.equal(fake.soundsPlayed().at(-1), DESELECT_SOUND);
    assert.equal(fake.currentMenu(), null);
    assert.ok(!press(fake, "Next").defaultPrevented);
});

test("Select runs the chosen entry's command as the native menu would, with the Select sound", () => {
    openMainMenu(fake);
    chooseEntry(fake, "Play");

    assert.ok(!isDrawnMenuShown(fake));
    assert.equal(fake.executedCommands().at(-1), globalThis.command.PlayGame);
    assert.equal(fake.soundsPlayed().at(-1), SELECT_SOUND);
});

test("Launch chooses too, and a pack entry runs its action", async () => {
    const launchesBefore = fake.launches().length;
    openMainMenu(fake);
    chooseEntry(fake, LABELS.tableOfTheWeek, "Launch");
    for (let step = 0; step < 20; step++) {
        await settle();
        fake.advanceTime(1000);
    }

    assert.ok(!isDrawnMenuShown(fake));
    assert.equal(fake.executedCommands().at(-1), fake.commandId("tableOfTheWeek"));
    assert.equal(fake.launches().length, launchesBefore + 1, "the Table of the Week is launched");
});

test("attract mode closes the menu without running anything", () => {
    openMainMenu(fake);
    const commandsBefore = fake.executedCommands().length;
    fake.enterAttractMode();

    assert.ok(!isDrawnMenuShown(fake));
    assert.equal(fake.executedCommands().length, commandsBefore);
    fake.exitAttractMode();
});
