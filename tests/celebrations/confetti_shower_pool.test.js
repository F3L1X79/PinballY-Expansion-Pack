// ============================================================
// Confetti Shower module on the fake host, its drawing ahead run step by
// step: a shower started before any confetto is drawn does not start and
// says why in the log; one started before the whole pool is drawn falls
// with the confetti drawn so far.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import { createConfettiShower, CONFETTI_Z_INDEX } from "../../common/confetti_shower.js";

const SHOWER_MS = 10000;

// A Drawing ahead whose single step the test runs by hand.
function manualDrawingAhead() {
    let drawStep = null;
    return {
        add(step) {
            drawStep = step;
            return () => {};
        },
        runSteps(count) {
            for (let index = 0; index < count; index++) drawStep();
        },
    };
}

const visibleLayers = fake => fake.drawingLayers()
    .filter(layer => layer.zIndex === CONFETTI_Z_INDEX && layer.alpha > 0);

test("a shower with no confetti drawn yet does not start, and says why", () => {
    const fake = createFakePinballYHost();
    const drawingAhead = manualDrawingAhead();
    const shower = createConfettiShower(fake, { drawingAhead });

    shower.start();
    fake.advanceTime(SHOWER_MS);

    assert.equal(visibleLayers(fake).length, 0);
    assert.equal(fake.runningIntervalCount(), 0);
    assert.deepEqual(fake.logLines(), ["[ConfettiShower] Not started: no confetti drawn ahead yet."]);
});

test("a shower started before the whole pool is drawn falls with the confetti drawn so far", () => {
    const fake = createFakePinballYHost();
    const drawingAhead = manualDrawingAhead();
    const shower = createConfettiShower(fake, { drawingAhead });
    const drawnCount = 5;
    // The window's size first, then one confetto per step.
    drawingAhead.runSteps(1 + drawnCount);

    shower.start();
    let mostVisible = 0;
    for (let elapsedMs = 0; elapsedMs < SHOWER_MS; elapsedMs += 16) {
        fake.advanceTime(16);
        mostVisible = Math.max(mostVisible, visibleLayers(fake).length);
    }

    assert.ok(mostVisible > 0, "the confetti drawn so far fall");
    assert.ok(mostVisible <= drawnCount, "one side of each confetto at a time");
    assert.deepEqual(fake.logLines(), [`[ConfettiShower] Started with ${drawnCount} confetti.`]);
    assert.equal(visibleLayers(fake).length, 0);
    assert.equal(fake.runningIntervalCount(), 0);
});

// PinballY stretches a layer over the whole window by default and still
// fills every pixel of a hidden one on each frame: 684 such layers slowed a
// single landscape screen's wheel to about 10 frames a second.
test("no confetto waits as a hidden layer the size of the window, before or after a shower", () => {
    const fake = createFakePinballYHost();
    const drawingAhead = manualDrawingAhead();
    const shower = createConfettiShower(fake, { drawingAhead });
    const drawnCount = 20;
    drawingAhead.runSteps(1 + drawnCount);
    const spansWindow = layer => layer.scale().xSpan >= 1 || layer.scale().ySpan >= 1;
    const fullWindowHidden = () => fake.drawingLayers()
        .filter(layer => layer.zIndex === CONFETTI_Z_INDEX && layer.alpha === 0 && spansWindow(layer));

    assert.equal(fullWindowHidden().length, 0, "drawn ahead");

    shower.start();
    fake.advanceTime(SHOWER_MS);

    assert.equal(visibleLayers(fake).length, 0);
    assert.equal(fullWindowHidden().length, 0, "after the shower");
});
