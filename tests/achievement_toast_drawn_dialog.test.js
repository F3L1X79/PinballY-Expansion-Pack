// ============================================================
// Achievement Toast module with the wheel dialog module on the fake host:
// an Achievement Toast, a Mastery Toast and the Confetti Shower of a
// celebrated toast submitted while a drawn dialog is open are not drawn
// until it closes, then play. A native dialog does not hold them.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "./fake_pinbally_host.js";
import { createAchievementToasts, TOAST_KIND } from "../common/achievement_toast.js";
import { createWheelDialogs, DIALOG_PRIORITY } from "../common/wheel_dialog.js";
import { STEAMBALL_COLORS } from "../common/steamball_palette.js";

// Enough for a batch to rise into place, shorter than any hold.
const RISE_MS = 1000;

// Lets the wheel dialog module's deferred showing (setTimeout 0) run.
const nextTick = () => new Promise(resolve => setTimeout(resolve, 0));

const TITLES = ["achievement", "mastery"];

// Titles of the cards drawn; a Mastery Toast draws its tile number first.
const cardTitles = fake => fake.drawingLayers()
    .map(layer => layer.texts().find(text => TITLES.includes(text)))
    .filter(Boolean);

function setUp() {
    const fake = createFakePinballYHost();
    fake.installGlobals();
    const wheelDialogs = createWheelDialogs(fake);
    const showers = [];
    const toasts = createAchievementToasts(fake, { wheelDialogs, confettiShower: { start: () => showers.push(true) } });
    return { fake, wheelDialogs, toasts, showers };
}

async function openDrawnDialog(wheelDialogs) {
    let close = null;
    wheelDialogs.submit({ priority: DIALOG_PRIORITY.STARTUP_PROMPT, open: done => { close = done; } });
    await nextTick();
    assert.ok(close, "the drawn dialog is open");
    return close;
}

test("toasts and the Confetti Shower wait for a drawn dialog to close, then play", async () => {
    const { fake, wheelDialogs, toasts, showers } = setUp();
    const close = await openDrawnDialog(wheelDialogs);
    const shown = [];

    toasts.submit({ title: "achievement", description: "", celebrate: true, onShown: () => shown.push("achievement") });
    toasts.submit({
        kind: TOAST_KIND.MASTERY, title: "mastery", description: "", accent: STEAMBALL_COLORS.gold, tileNumber: 2,
        onShown: () => shown.push("mastery"),
    });
    fake.fire("wheelmode");
    fake.advanceTime(RISE_MS);
    assert.deepEqual(cardTitles(fake), [], "nothing drawn over the drawn dialog");
    assert.deepEqual(shown, []);
    assert.deepEqual(showers, [], "no confetti over the drawn dialog");

    close();
    fake.advanceTime(RISE_MS);
    assert.deepEqual(cardTitles(fake), ["achievement", "mastery"]);
    assert.deepEqual(shown, ["achievement", "mastery"]);
    assert.equal(showers.length, 1);
});

test("a native dialog does not hold the toasts", async () => {
    const { fake, wheelDialogs, toasts } = setUp();
    wheelDialogs.submit({ id: "ratingPrompt", message: "Rate", buttons: [{ label: "OK" }], priority: DIALOG_PRIORITY.RATING_PROMPT });
    await nextTick();
    assert.equal(fake.currentMenu().id, "ratingPrompt");

    toasts.submit({ title: "achievement", description: "", onShown() {} });
    fake.advanceTime(RISE_MS);
    assert.deepEqual(cardTitles(fake), ["achievement"]);
});
