// ============================================================
// Wheel dialog module tests: dialogs submitted through its interface are
// shown on the fake host one at a time, only when the wheel is free, in
// priority order, and the queue advances however a dialog closes. A dialog
// is shown one tick after its submission or the event that frees the wheel.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "./fake_pinbally_host.js";
import { createWheelDialogs, DIALOG_PRIORITY } from "../common/wheel_dialog.js";

const GAME = { id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness" };

function setUp() {
    const fake = createFakePinballYHost({ tables: [GAME] });
    const dialogs = createWheelDialogs(fake);
    return { fake, dialogs };
}

function ratingDialog(name, extra = {}) {
    return {
        id: "ratingPrompt",
        message: `Rate ${name}`,
        buttons: [{ label: "OK" }],
        priority: DIALOG_PRIORITY.RATING_PROMPT,
        ...extra,
    };
}

// Lets the deferred showing (setTimeout 0) run.
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

function shownMessages(fake) {
    return fake.shownMenus().map(menu => menu.items[0].title);
}

test("a dialog submitted on a free wheel is shown on the next tick, message then separator then buttons", async () => {
    const { fake, dialogs } = setUp();

    dialogs.submit(ratingDialog("A"));
    assert.equal(fake.currentMenu(), null);
    await settle();

    const menu = fake.currentMenu();
    assert.equal(menu.id, "ratingPrompt");
    assert.deepEqual(menu.options, { dialogStyle: true });
    assert.equal(menu.items.length, 3);
    assert.deepEqual(menu.items[0], { title: "Rate A", cmd: -1 });
    assert.deepEqual(menu.items[1], { cmd: -1 });
    assert.equal(menu.items[2].title, "OK");
    assert.ok(menu.items[2].cmd > 0, "a button needs a real command to be selectable");
});

test("nothing is shown while a game runs; the dialog appears on the next free wheel", async () => {
    const { fake, dialogs } = setUp();
    fake.playGame(GAME);
    fake.gameStarted(GAME);

    dialogs.submit(ratingDialog("A"));
    await settle();
    assert.equal(fake.currentMenu(), null);

    fake.gameOver(GAME);
    await settle();
    assert.deepEqual(shownMessages(fake), ["Rate A"]);
});

test("nothing is shown over another menu; the dialog appears once it closes", async () => {
    const { fake, dialogs } = setUp();
    fake.openMenu("main", [{ title: "Play", cmd: 1 }]);

    dialogs.submit(ratingDialog("A"));
    await settle();
    assert.equal(fake.currentMenu().id, "main");

    fake.closeMenu();
    await settle();
    assert.equal(fake.currentMenu().id, "ratingPrompt");
    assert.equal(fake.shownMenus().filter(menu => menu.id === "ratingPrompt").length, 1);
});

test("several dialogs are shown one after the other, acknowledged or dismissed", async () => {
    const { fake, dialogs } = setUp();

    dialogs.submit(ratingDialog("A"));
    dialogs.submit(ratingDialog("B"));
    dialogs.submit(ratingDialog("C"));
    await settle();
    assert.deepEqual(shownMessages(fake), ["Rate A"]);

    fake.selectMenuItem("OK");
    await settle();
    assert.deepEqual(shownMessages(fake), ["Rate A", "Rate B"]);

    // Escape.
    fake.closeMenu();
    await settle();
    assert.deepEqual(shownMessages(fake), ["Rate A", "Rate B", "Rate C"]);

    fake.closeMenu();
    await settle();
    assert.equal(fake.currentMenu(), null);
});

test("onShown runs when the dialog is shown, not when it is queued", async () => {
    const { fake, dialogs } = setUp();
    const shown = [];

    dialogs.submit(ratingDialog("A", { onShown: () => shown.push("A") }));
    dialogs.submit(ratingDialog("B", { onShown: () => shown.push("B") }));
    assert.deepEqual(shown, []);
    await settle();
    assert.deepEqual(shown, ["A"]);

    fake.closeMenu();
    await settle();
    assert.deepEqual(shown, ["A", "B"]);
});

test("a button runs its own dialog's action, and a closed dialog's buttons do nothing", async () => {
    const { fake, dialogs } = setUp();
    const actions = [];

    dialogs.submit({
        id: "first",
        message: "First",
        buttons: [{ label: "Yes", action: () => actions.push("first:yes") }, { label: "No", action: () => actions.push("first:no") }],
        priority: DIALOG_PRIORITY.RATING_PROMPT,
    });
    dialogs.submit({
        id: "second",
        message: "Second",
        buttons: [{ label: "Yes", action: () => actions.push("second:yes") }, { label: "Later" }],
        priority: DIALOG_PRIORITY.RATING_PROMPT,
    });
    await settle();

    const firstYesCommand = fake.currentMenu().items[2].cmd;
    fake.selectMenuItem("No");
    await settle();
    fake.selectMenuItem("Yes");
    await settle();
    assert.deepEqual(actions, ["first:no", "second:yes"]);

    fake.fire("command", { id: firstYesCommand });
    assert.deepEqual(actions, ["first:no", "second:yes"]);
});

test("a button that launches a game makes the next dialog wait for the wheel", async () => {
    const { fake, dialogs } = setUp();

    dialogs.submit({
        id: "launcher",
        message: "Play?",
        buttons: [{ label: "Play", action: () => fake.playGame(GAME) }],
        priority: DIALOG_PRIORITY.STARTUP_PROMPT,
    });
    dialogs.submit(ratingDialog("A"));
    await settle();

    fake.selectMenuItem("Play");
    await settle();
    assert.equal(fake.currentMenu(), null);

    fake.gameStarted(GAME);
    fake.gameOver(GAME);
    await settle();
    assert.deepEqual(shownMessages(fake), ["Play?", "Rate A"]);
});

test("waiting dialogs are shown by priority, whatever the submission order", async () => {
    for (const order of [["rating", "startup"], ["startup", "rating"]]) {
        const { fake, dialogs } = setUp();
        const descriptions = {
            startup: { id: "startup", message: "Startup", buttons: [{ label: "OK" }], priority: DIALOG_PRIORITY.STARTUP_PROMPT },
            rating: ratingDialog("A"),
        };
        fake.playGame(GAME);
        fake.gameStarted(GAME);

        for (const name of order) dialogs.submit(descriptions[name]);
        fake.gameOver(GAME);
        await settle();
        fake.closeMenu();
        await settle();

        assert.deepEqual(shownMessages(fake), ["Startup", "Rate A"], order.join(","));
    }
});

test("a dialog with the same priority waits behind the ones already queued", async () => {
    const { fake, dialogs } = setUp();
    fake.playGame(GAME);
    fake.gameStarted(GAME);

    dialogs.submit(ratingDialog("A"));
    dialogs.submit({ id: "startup", message: "Startup", buttons: [{ label: "OK" }], priority: DIALOG_PRIORITY.STARTUP_PROMPT });
    dialogs.submit(ratingDialog("B"));
    fake.gameOver(GAME);
    await settle();
    fake.closeMenu();
    await settle();
    fake.closeMenu();
    await settle();

    assert.deepEqual(shownMessages(fake), ["Startup", "Rate A", "Rate B"]);
});

test("dialogs submitted together on a free wheel are shown by priority", async () => {
    const { fake, dialogs } = setUp();

    dialogs.submit(ratingDialog("A"));
    dialogs.submit({ id: "startup", message: "Startup", buttons: [{ label: "OK" }], priority: DIALOG_PRIORITY.STARTUP_PROMPT });
    await settle();
    assert.deepEqual(shownMessages(fake), ["Startup"]);

    fake.closeMenu();
    await settle();
    assert.deepEqual(shownMessages(fake), ["Startup", "Rate A"]);
});

test("a dialog on screen is never replaced by a higher-priority one", async () => {
    const { fake, dialogs } = setUp();

    dialogs.submit(ratingDialog("A"));
    await settle();
    dialogs.submit({ id: "startup", message: "Startup", buttons: [{ label: "OK" }], priority: DIALOG_PRIORITY.STARTUP_PROMPT });
    await settle();
    assert.deepEqual(shownMessages(fake), ["Rate A"]);

    fake.closeMenu();
    await settle();
    assert.deepEqual(shownMessages(fake), ["Rate A", "Startup"]);
});

test("a dialog replaced by another menu lets the next one wait for that menu to close", async () => {
    const { fake, dialogs } = setUp();
    dialogs.submit(ratingDialog("A"));
    dialogs.submit(ratingDialog("B"));
    await settle();

    // PinballY opens the new menu before firing the old one's "menuclose".
    fake.openMenu("main", [{ title: "Play", cmd: 1 }]);
    fake.fire("menuclose", { id: "ratingPrompt" });
    await settle();
    assert.equal(fake.currentMenu().id, "main");

    fake.closeMenu();
    await settle();
    assert.deepEqual(shownMessages(fake).filter(message => message !== "Play"), ["Rate A", "Rate B"]);
});

test("another menu closing does not advance the queue", async () => {
    const { fake, dialogs } = setUp();

    dialogs.submit(ratingDialog("A"));
    dialogs.submit(ratingDialog("B"));
    await settle();
    fake.fire("menuclose", { id: "someOtherMenu" });
    await settle();

    assert.deepEqual(shownMessages(fake), ["Rate A"]);
});

test("a failing button action is logged and the queue still advances", async () => {
    const { fake, dialogs } = setUp();
    const uninstallGlobals = fake.installGlobals();
    try {
        dialogs.submit({
            id: "broken",
            message: "Broken",
            buttons: [{ label: "Go", action: () => { throw new Error("boom"); } }],
            priority: DIALOG_PRIORITY.RATING_PROMPT,
        });
        dialogs.submit(ratingDialog("A"));
        await settle();

        fake.selectMenuItem("Go");
        // The command handler is async, so the error is logged a tick later.
        await settle();

        assert.deepEqual(shownMessages(fake), ["Broken", "Rate A"]);
        assert.equal(fake.logLines().filter(line => line.includes("[WheelDialog] ERROR") && line.includes("boom")).length, 1);
    } finally {
        uninstallGlobals();
    }
});

// A drawn dialog that records when the module opens it and closes on demand.
function drawnDialog(priority = DIALOG_PRIORITY.STARTUP_PROMPT) {
    const drawn = { opened: 0, close: null, priority };
    drawn.open = close => {
        drawn.opened++;
        drawn.close = close;
    };
    return drawn;
}

test("a drawn dialog with a higher priority opens first and holds the native one until it reports closed", async () => {
    const { fake, dialogs } = setUp();
    const drawn = drawnDialog();

    dialogs.submit(ratingDialog("A"));
    dialogs.submit(drawn);
    await settle();
    assert.equal(drawn.opened, 1);
    assert.equal(fake.currentMenu(), null, "no native menu over the drawn dialog");

    fake.fire("wheelmode");
    await settle();
    assert.equal(fake.currentMenu(), null, "a return to the wheel does not release the queue");

    drawn.close();
    await settle();
    assert.deepEqual(shownMessages(fake), ["Rate A"]);
    assert.equal(drawn.opened, 1);
});

test("isIdle is false while a drawn dialog is open, true once it closed and nothing waits", async () => {
    const { dialogs } = setUp();
    const drawn = drawnDialog();

    dialogs.submit(drawn);
    await settle();
    assert.equal(dialogs.isIdle(), false);
    assert.equal(dialogs.isDrawnDialogOpen(), true);

    drawn.close();
    assert.equal(dialogs.isIdle(), true);
    assert.equal(dialogs.isDrawnDialogOpen(), false);
});

test("a native dialog submitted while a drawn one is open waits for it", async () => {
    const { fake, dialogs } = setUp();
    const drawn = drawnDialog(DIALOG_PRIORITY.RATING_PROMPT);

    dialogs.submit(drawn);
    await settle();
    dialogs.submit({ id: "startup", message: "Startup", buttons: [{ label: "OK" }], priority: DIALOG_PRIORITY.STARTUP_PROMPT });
    await settle();
    assert.equal(fake.currentMenu(), null);

    drawn.close();
    await settle();
    assert.deepEqual(shownMessages(fake), ["Startup"]);
});

test("a drawn dialog waits for a free wheel, and closing it twice advances the queue once", async () => {
    const { fake, dialogs } = setUp();
    const drawn = drawnDialog();

    fake.playGame(GAME);
    dialogs.submit(drawn);
    dialogs.submit(ratingDialog("A"));
    dialogs.submit(ratingDialog("B"));
    await settle();
    assert.equal(drawn.opened, 0, "not over a game");

    fake.gameOver(GAME);
    await settle();
    assert.equal(drawn.opened, 1);

    drawn.close();
    drawn.close();
    await settle();
    assert.deepEqual(shownMessages(fake), ["Rate A"]);
});

test("closed listeners hear each drawn dialog close, never a native one", async () => {
    const { fake, dialogs } = setUp();
    const drawn = drawnDialog();
    let heard = 0;
    dialogs.onDrawnDialogClosed(() => { heard++; });

    dialogs.submit(drawn);
    dialogs.submit(ratingDialog("A"));
    await settle();
    drawn.close();
    await settle();
    fake.closeMenu();
    await settle();
    assert.equal(heard, 1);
});

test("a drawn dialog that fails to open is logged and the queue advances", async () => {
    const { fake, dialogs } = setUp();
    const uninstallGlobals = fake.installGlobals();
    try {
        dialogs.submit({ priority: DIALOG_PRIORITY.STARTUP_PROMPT, open() { throw new Error("boom"); } });
        dialogs.submit(ratingDialog("A"));
        await settle();
        await settle();

        assert.deepEqual(shownMessages(fake), ["Rate A"]);
        assert.equal(fake.logLines().filter(line => line.includes("[WheelDialog] ERROR") && line.includes("boom")).length, 1);
    } finally {
        uninstallGlobals();
    }
});
