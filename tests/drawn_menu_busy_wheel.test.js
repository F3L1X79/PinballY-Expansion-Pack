// ============================================================
// An open Drawn Menu keeps the wheel busy, through main.js on the fake
// PinballY globals: a wheel dialog submitted while the main menu is
// drawn shows only once it closes, by Exit or by a choice; a dialog's
// own Drawn Menu never holds the queue it belongs to; an Achievement
// Toast still shows over an open Drawn Menu.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { toastDrawings } from "./achievement_toast_reader.js";
import { isDrawnMenuShown, drawnMenuLines, press, chooseEntry, openMainMenu, OPEN_OVER_MS } from "./drawn_menu_reader.js";

const ADD_ONS_UNDER_TEST = ["drawnMenus"];

const fake = createFakePinballYHost({ now: new Date(2026, 9, 10, 20, 0, 0) });
let wheelDialogs;
let DIALOG_PRIORITY;
let achievementToasts;

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";
    ({ getWheelDialogs: wheelDialogs, DIALOG_PRIORITY } = await import("../common/wheel_dialog.js"));
    ({ getAchievementToasts: achievementToasts } = await import("../common/achievement_toast.js"));
    await import("../main.js");
    await settle();
});

function submitDialog(label) {
    wheelDialogs().submit({ id: `${label}Dialog`, message: label, buttons: [{ label: `${label} OK` }], priority: DIALOG_PRIORITY.RATING_PROMPT });
}

async function letDialogsOpen() {
    await settle();
    fake.advanceTime(OPEN_OVER_MS);
}

test("a wheel dialog submitted while the main Drawn Menu is open waits for Exit", async () => {
    openMainMenu(fake);
    const mainMenuLines = drawnMenuLines(fake);
    submitDialog("Waiting");
    await letDialogsOpen();
    assert.deepEqual(drawnMenuLines(fake), mainMenuLines, "the main menu stays");

    press(fake, "Exit");
    await letDialogsOpen();
    assert.deepEqual(drawnMenuLines(fake), ["Waiting OK"], "the dialog follows");
    press(fake, "Exit");
    await settle();
    assert.ok(!isDrawnMenuShown(fake));
});

test("a wheel dialog submitted while the main Drawn Menu is open shows after a choice that leaves the wheel free", async () => {
    openMainMenu(fake);
    const [firstEntry] = drawnMenuLines(fake).filter(line => line !== "---");
    submitDialog("Chosen");
    await letDialogsOpen();
    assert.notDeepEqual(drawnMenuLines(fake), ["Chosen OK"]);

    chooseEntry(fake, firstEntry);
    await letDialogsOpen();
    assert.deepEqual(drawnMenuLines(fake), ["Chosen OK"]);
    press(fake, "Exit");
    await settle();
});

test("a dialog's own Drawn Menu does not hold the queue it belongs to", async () => {
    submitDialog("First");
    submitDialog("Second");
    await letDialogsOpen();
    assert.deepEqual(drawnMenuLines(fake), ["First OK"]);

    press(fake, "Select");
    await letDialogsOpen();
    assert.deepEqual(drawnMenuLines(fake), ["Second OK"]);
    press(fake, "Exit");
    await settle();
    assert.ok(!isDrawnMenuShown(fake));
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});

test("an Achievement Toast submitted while a Drawn Menu is open shows over it", async () => {
    openMainMenu(fake);
    const mainMenuLines = drawnMenuLines(fake);
    achievementToasts().submit({ title: "Over the menu", description: "", onShown() {} });
    await settle();
    fake.advanceTime(OPEN_OVER_MS);

    assert.ok(toastDrawings(fake).some(drawing => drawing.texts.includes("Over the menu")), "the toast is drawn");
    assert.deepEqual(drawnMenuLines(fake), mainMenuLines, "the menu stays open under it");
    press(fake, "Exit");
    await settle();
});
