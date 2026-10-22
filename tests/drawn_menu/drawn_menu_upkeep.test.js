// ============================================================
// The cabinet's upkeep menus as Drawn Menus, through main.js on the fake
// PinballY globals: capture (with the items seen on the cabinet), a batch
// capture step, deleting a table's details and a script's own menu are
// drawn; the media drop menus and "confirm delete media" stay native.
// - An excluded menu opening replaces an open Drawn Menu.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import {
    OPEN_OVER_MS, isDrawnMenuShown, readDrawnMenu, drawnMenuLines, highlightedEntry, squeezed, press, openMainMenu, openMenu, chooseEntry,
} from "./drawn_menu_reader.js";

const CAPTURE_MESSAGE = "Sélectionnez les éléments à capturer. La capture prend environ 2 minutes ; "
    + "pendant ce temps, le jeu se lance et chaque écran est enregistré tour à tour. "
    + "Les éléments marqués (!) demandent de régler l'audio du jeu.";
const BATCH_READY_MESSAGE = "Batch Capture is ready to go! 12 games will be captured, which will take about "
    + "24 minutes. Leave the cabinet alone until it is over; press Exit at any time to cancel the rest.";
const DELETE_GAMEINFO_QUESTION = "Do you really want to delete the game details for this table? "
    + "Its media files and its statistics are kept, but its title, year and manufacturer are removed.";
// Command ids of PinballY's capture entries, as it allocates them.
const MEDIA_CMD = 4000;
const DELAY_CMD = 4010;
const START_CMD = 4011;
const MEDIA_TYPES = ["Image du plateau", "Vidéo du plateau", "Image du fronton", "Vidéo du fronton", "Image du DMD"];
const MEDIA_MODES = ["Ignorer", "Capturer", "Conserver"];

const fake = createFakePinballYHost({ now: new Date(2026, 9, 22, 20, 0, 0) });
let menuReturn;
// Each media type's mode, cycled by its stayOpen entry.
const modes = MEDIA_TYPES.map(() => 0);

// As seen on the cabinet (log of 2026-10-22); PinballY marks the entry
// just chosen when it shows the menu again, "Démarrer la capture" first.
const captureItems = (selectedCmd = START_CMD) => [
    { title: CAPTURE_MESSAGE, cmd: -1 },
    { title: "", cmd: -1 },
    ...MEDIA_TYPES.map((type, index) => ({
        title: `${type} : ${MEDIA_MODES[modes[index]]}`, cmd: MEDIA_CMD + index, stayOpen: true, selected: MEDIA_CMD + index === selectedCmd,
    })),
    { title: "", cmd: -1 },
    { title: "Ajuster le délai de démarrage (10 sec)", cmd: DELAY_CMD, selected: DELAY_CMD === selectedCmd },
    { title: "", cmd: -1 },
    { title: "Démarrer la capture", cmd: START_CMD, selected: START_CMD === selectedCmd },
    { title: "Annuler", cmd: menuReturn },
];
const openCaptureMenu = () => openMenu(fake, "capture", captureItems(), { dialogStyle: true });
const someMenu = () => [{ title: "Yes", cmd: 4100 }, { title: "", cmd: -1 }, { title: "No", cmd: menuReturn }];

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "drawnMenus";
    config.language = "en";
    await import("../../main.js");
    await settle();
    fake.advanceTime(5000);
    menuReturn = globalThis.command.MenuReturn;
    // As PinballY: a media type's entry cycles its mode and the menu shows again.
    MEDIA_TYPES.forEach((type, index) => fake.setNativeCommand(MEDIA_CMD + index, () => {
        modes[index] = (modes[index] + 1) % MEDIA_MODES.length;
        fake.openMenu("capture", captureItems(MEDIA_CMD + index), { dialogStyle: true });
    }));
});

test("the capture menu is drawn, its message whole, the cursor on Démarrer la capture", () => {
    const openings = [];
    fake.on("menuopen", ev => { openings.push({ cancelled: ev.defaultPrevented, menuUpdated: ev.menuUpdated }); });
    openCaptureMenu();

    assert.deepEqual(openings.at(-1), { cancelled: true, menuUpdated: false });
    assert.equal(fake.currentMenu(), null, "no native menu");
    const menu = readDrawnMenu(fake);
    assert.equal(squeezed(menu.message), squeezed(CAPTURE_MESSAGE));
    assert.deepEqual(drawnMenuLines(fake), [
        ...MEDIA_TYPES.map(type => `${type} : Ignorer`), "---", "Ajuster le délai de démarrage (10 sec)", "---", "Démarrer la capture", "Annuler",
    ]);
    assert.equal(highlightedEntry(fake), "Démarrer la capture");
});

test("choosing a media type's entry redraws the menu in place, its new title shown, the cursor kept", () => {
    press(fake, "Next");
    press(fake, "Next");
    assert.equal(highlightedEntry(fake), "Image du plateau : Ignorer");
    press(fake, "Next");
    fake.fire("commandbuttondown", { command: "Select", repeat: false });

    assert.ok(isDrawnMenuShown(fake), "shown again at once, without fading in");
    assert.equal(fake.currentMenu(), null);
    assert.equal(drawnMenuLines(fake)[1], "Vidéo du plateau : Capturer");
    assert.equal(highlightedEntry(fake), "Vidéo du plateau : Capturer");
    fake.advanceTime(OPEN_OVER_MS);
});

test("Démarrer la capture closes the menu and runs its command", () => {
    chooseEntry(fake, "Démarrer la capture");

    assert.ok(!isDrawnMenuShown(fake));
    assert.equal(fake.executedCommands().at(-1), START_CMD);
});

test("Annuler closes the capture menu", () => {
    openCaptureMenu();
    chooseEntry(fake, "Annuler");

    assert.ok(!isDrawnMenuShown(fake));
    assert.equal(fake.executedCommands().at(-1), menuReturn);
});

test("Exit closes the capture menu", () => {
    openCaptureMenu();
    const commandsBefore = fake.executedCommands().length;
    press(fake, "Exit");

    assert.ok(!isDrawnMenuShown(fake));
    assert.equal(fake.executedCommands().length, commandsBefore, "no command run");
});

test("the batch capture's last step is drawn, its summary whole", () => {
    openMenu(fake, "batch capture ready", [
        { title: BATCH_READY_MESSAGE, cmd: -1 },
        { title: "", cmd: -1 },
        { title: "Begin capture", cmd: 4200 },
        { title: "View list", cmd: 4201 },
        { title: "Cancel", cmd: menuReturn },
    ], { dialogStyle: true });

    assert.equal(fake.currentMenu(), null);
    assert.equal(squeezed(readDrawnMenu(fake).message), squeezed(BATCH_READY_MESSAGE));
    assert.deepEqual(drawnMenuLines(fake), ["Begin capture", "View list", "Cancel"]);
    press(fake, "Exit");
    assert.ok(!isDrawnMenuShown(fake));
});

test("deleting a table's details asks its question drawn, whole", () => {
    openMenu(fake, "confirm delete gameinfo", [
        { title: DELETE_GAMEINFO_QUESTION, cmd: -1 },
        { title: "", cmd: -1 },
        { title: "Yes, delete", cmd: 4300 },
        { title: "No", cmd: menuReturn },
    ]);

    assert.equal(fake.currentMenu(), null);
    assert.deepEqual(drawnMenuLines(fake), [`[${DELETE_GAMEINFO_QUESTION.toUpperCase()}]`, "---", "Yes, delete", "No"]);
    press(fake, "Exit");
});

test("a script's own menu is drawn", () => {
    openMenu(fake, "someScript.choice", someMenu());

    assert.equal(fake.currentMenu(), null);
    assert.deepEqual(drawnMenuLines(fake), ["Yes", "---", "No"]);
    press(fake, "Exit");
});

test("the media drop menus and confirm delete media stay native and replace an open Drawn Menu", () => {
    for (const id of ["media drop confirm", "media drop rename", "confirm delete media"]) {
        openMainMenu(fake);
        assert.ok(isDrawnMenuShown(fake), id);
        fake.openMenu(id, someMenu());

        assert.equal(fake.currentMenu().id, id, `${id}: not cancelled`);
        assert.ok(!isDrawnMenuShown(fake), `${id}: the Drawn Menu closed`);
        assert.ok(!press(fake, "Next").defaultPrevented, `${id}: the buttons are left to the native menu`);
        fake.closeMenu();
    }
});

test("no error is logged", () => {
    assertNoErrorLogged(fake);
});
