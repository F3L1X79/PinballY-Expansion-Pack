// ============================================================
// The wheel dialogs as Drawn Menus, through main.js on the fake PinballY
// globals: the rating prompt is drawn with its message above its buttons,
// each button runs its action and Exit dismisses it, the next queued
// dialog following once it closed, in priority order; a dialog that
// fails to draw logs the error and shows natively, the queue still
// advancing on its close.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";
import { isDrawnMenuShown, drawnMenuLines, readDrawnMenu, highlightedEntry, squeezed, press, chooseEntry, OPEN_OVER_MS } from "./drawn_menu_reader.js";

const ADD_ONS_UNDER_TEST = ["ratingPrompt", "drawnMenus"];
const THRESHOLD_MINUTES = 60;
const TABLES = [1, 2, 3, 4].map(id => ({
    id, configId: `table${id}`, title: `Table ${id}`, manufacturer: "Williams", year: 1990 + id,
    playCount: 1, playTime: 0, rating: -1, isHidden: false,
}));

const fake = createFakePinballYHost({ now: new Date(2026, 9, 10, 20, 0, 0), tables: TABLES });
let TEXT;
let wheelDialogs;
let DIALOG_PRIORITY;

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ADD_ONS_UNDER_TEST.includes(key);
    config.language = "en";
    config.askToRateAfterMinutesPlayed = THRESHOLD_MINUTES;
    const { default: lang } = await import("../../common/i18n.js");
    TEXT = lang.ratingPrompt;
    ({ getWheelDialogs: wheelDialogs, DIALOG_PRIORITY } = await import("../../common/wheel_dialog.js"));
    await import("../../main.js");
    await settle();
});

// Plays the table past the rating threshold, back to the wheel, then
// lets the dialog open and fade in.
async function playPastThreshold(table) {
    const game = fake.getGameInfo(table.id);
    fake.playGame(game);
    fake.gameStarted(game);
    game.playTime = (THRESHOLD_MINUTES + 1) * 60;
    fake.gameOver(game);
    await settle();
    fake.advanceTime(OPEN_OVER_MS);
}

const messageOf = table => TEXT.message(table.title, THRESHOLD_MINUTES);

test("the rating prompt is drawn with its message above its buttons, and Rate Now runs its action", async () => {
    await playPastThreshold(TABLES[0]);

    assert.equal(fake.currentMenu(), null, "no native dialog");
    assert.ok(isDrawnMenuShown(fake));
    assert.equal(squeezed(readDrawnMenu(fake).message), squeezed(messageOf(TABLES[0])));
    assert.deepEqual(drawnMenuLines(fake), [TEXT.rateNow, TEXT.notNow]);
    assert.equal(highlightedEntry(fake), TEXT.rateNow);

    chooseEntry(fake, TEXT.rateNow);
    await settle();

    assert.ok(!isDrawnMenuShown(fake));
    assert.ok(fake.executedCommands().includes(globalThis.command.RateGame), "PinballY's rating dialog opens");
});

test("Not Now closes the rating prompt without rating", async () => {
    await playPastThreshold(TABLES[1]);
    const executedBefore = fake.executedCommands().length;

    chooseEntry(fake, TEXT.notNow);
    await settle();

    assert.ok(!isDrawnMenuShown(fake));
    assert.ok(!fake.executedCommands().slice(executedBefore).includes(globalThis.command.RateGame));
});

test("Exit dismisses the rating prompt, and the next queued dialog follows in priority order", async () => {
    const shownOrder = [];
    const game = fake.getGameInfo(TABLES[2].id);
    fake.playGame(game);
    fake.gameStarted(game);
    game.playTime = (THRESHOLD_MINUTES + 1) * 60;
    fake.gameOver(game);
    // In the same tick as the rating prompt: one dialog after it, one before.
    wheelDialogs().submit({
        id: "laterDialog", message: "Shown last", buttons: [{ label: "Later OK" }], priority: DIALOG_PRIORITY.RATING_PROMPT + 1,
        onShown: () => shownOrder.push("later"),
    });
    wheelDialogs().submit({
        id: "firstDialog", message: "Shown first", buttons: [{ label: "First OK" }], priority: DIALOG_PRIORITY.REWARD_PROMPT,
        onShown: () => shownOrder.push("first"),
    });
    await settle();
    fake.advanceTime(OPEN_OVER_MS);

    assert.deepEqual(drawnMenuLines(fake), ["First OK"]);
    press(fake, "Exit");
    await settle();
    fake.advanceTime(OPEN_OVER_MS);
    assert.deepEqual(drawnMenuLines(fake), [TEXT.rateNow, TEXT.notNow], "the rating prompt follows");

    const executedBefore = fake.executedCommands().length;
    press(fake, "Exit");
    await settle();
    fake.advanceTime(OPEN_OVER_MS);
    assert.deepEqual(fake.executedCommands().slice(executedBefore), [], "Exit runs nothing");
    assert.deepEqual(drawnMenuLines(fake), ["Later OK"]);
    press(fake, "Select");
    await settle();

    assert.ok(!isDrawnMenuShown(fake));
    assert.equal(fake.currentMenu(), null);
    assert.deepEqual(shownOrder, ["first", "later"]);
});

test("a dialog that fails to draw logs the error and shows natively, the queue advancing on its close", async () => {
    const RealStyledText = globalThis.StyledText;
    globalThis.StyledText = class {
        constructor() { throw new Error("DirectWrite is gone"); }
    };
    try {
        await playPastThreshold(TABLES[3]);
        wheelDialogs().submit({ id: "nextDialog", message: "Next", buttons: [{ label: "Next OK" }], priority: DIALOG_PRIORITY.RATING_PROMPT });
        await settle();
    } finally {
        globalThis.StyledText = RealStyledText;
    }

    assert.ok(!isDrawnMenuShown(fake));
    assert.equal(fake.currentMenu().id, "ratingPrompt", "the native dialog shows");
    assert.equal(fake.currentMenu().items[0].title, messageOf(TABLES[3]));
    assert.ok(fake.logLines().some(line => line.startsWith("[DrawnMenus] ERROR") && line.includes("DirectWrite is gone")));

    fake.selectMenuItem(TEXT.rateNow);
    await settle();
    fake.advanceTime(OPEN_OVER_MS);

    assert.ok(fake.executedCommands().includes(globalThis.command.RateGame));
    assert.deepEqual(drawnMenuLines(fake), ["Next OK"], "the next dialog follows, drawn");
    press(fake, "Exit");
});
