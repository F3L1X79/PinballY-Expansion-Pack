// ============================================================
// Drawing ahead tests: over the fake PinballY host, checks that the work
// runs in slices of about 12 ms with PinballY's own work in between, waits
// 400 ms after a button press, sleeps once done until woken again, and
// that a failing step is logged once and does not stop the others.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import { createDrawingAhead } from "../../common/drawing_ahead.js";

// A step that takes 5 ms of the clock each time, for count steps.
function timedWork(fake, count) {
    const stepTimes = [];
    const step = () => {
        if (stepTimes.length === count) return false;
        stepTimes.push(fake.now().getTime());
        fake.setNow(new Date(fake.now().getTime() + 5));
        return true;
    };
    return { step, stepTimes };
}

test("the work runs in slices of about 12 ms, with a pause between them", () => {
    const fake = createFakePinballYHost();
    const startMs = fake.now().getTime();
    const drawingAhead = createDrawingAhead(fake);
    const work = timedWork(fake, 9);

    drawingAhead.add(work.step);
    fake.advanceTime(399);
    assert.deepEqual(work.stepTimes, [], "startup counts as a button press");
    fake.advanceTime(1000);

    const offsets = work.stepTimes.map(ms => ms - startMs);
    assert.equal(offsets.length, 9);
    const slices = [];
    offsets.forEach((offset, index) => {
        if (index === 0 || offset - offsets[index - 1] > 5) slices.push([]);
        slices.at(-1).push(offset);
    });
    assert.deepEqual(slices.map(slice => slice.length), [3, 3, 3], "three 5 ms steps reach 12 ms");
});

test("a woken work waits 400 ms after the last button press, and sleeps once done", () => {
    const fake = createFakePinballYHost();
    const drawingAhead = createDrawingAhead(fake);
    let pending = 0;
    let steps = 0;
    const wake = drawingAhead.add(() => {
        if (pending === 0) return false;
        pending--;
        steps++;
        return true;
    });
    fake.advanceTime(1000);

    pending = 2;
    fake.fire("commandbuttondown", { command: "Next" });
    wake();
    fake.advanceTime(390);
    assert.equal(steps, 0);
    fake.advanceTime(20);
    assert.equal(steps, 2);
});

test("a failing step is logged, sleeps, and the other work goes on", () => {
    const fake = createFakePinballYHost();
    const drawingAhead = createDrawingAhead(fake);
    drawingAhead.add(() => { throw new Error("broken layer"); });
    const work = timedWork(fake, 4);
    drawingAhead.add(work.step);

    fake.advanceTime(10 * 1000);

    assert.equal(work.stepTimes.length, 4);
    assert.equal(fake.logLines().filter(line => line.startsWith("[DrawingAhead]") && line.includes("broken layer")).length, 1);
});
