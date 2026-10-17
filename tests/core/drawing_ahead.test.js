// ============================================================
// Drawing ahead tests: over the fake PinballY host, checks that the work
// runs in slices of about 12 ms with PinballY's own work in between, waits
// 400 ms after a button press, sleeps once done until woken again, and
// that a failing step is logged once and does not stop the others.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import { createDrawingAhead } from "../../common/core/drawing_ahead.js";

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

// Splits step times into slices: a gap longer than a step starts a new one.
function slicesOf(stepTimes, stepMs) {
    const slices = [];
    stepTimes.forEach((ms, index) => {
        if (index === 0 || ms - stepTimes[index - 1] > stepMs) slices.push([]);
        slices.at(-1).push(ms);
    });
    return slices;
}

test("foreground work starts at once after a press and runs in slices of about 30 ms", () => {
    const fake = createFakePinballYHost();
    const drawingAhead = createDrawingAhead(fake);
    fake.advanceTime(1000);
    const work = timedWork(fake, 18);
    let doneAt = null;

    fake.fire("commandbuttondown", { command: "Select" });
    const startMs = fake.now().getTime();
    drawingAhead.runInForeground(work.step, { onDone: () => { doneAt = fake.now().getTime(); } });
    fake.advanceTime(1);
    assert.deepEqual(work.stepTimes.slice(0, 1), [startMs + 1], "no wait after the press");

    fake.advanceTime(200);
    assert.equal(work.stepTimes.length, 18);
    const slices = slicesOf(work.stepTimes, 5);
    assert.deepEqual(slices.map(slice => slice.length), [6, 6, 6], "six 5 ms steps reach 30 ms");
    const pauses = slices.slice(1).map((slice, index) => slice[0] - (slices[index].at(-1) + 5));
    assert.ok(pauses.every(pause => pause > 0 && pause <= 20), `a short pause between slices, got ${pauses}`);
    assert.ok(doneAt !== null, "told once nothing is left");
});

test("background work waits until the foreground work is over", () => {
    const fake = createFakePinballYHost();
    const drawingAhead = createDrawingAhead(fake);
    fake.advanceTime(1000);
    const background = timedWork(fake, 100);
    const foreground = timedWork(fake, 30);
    let doneAt = null;

    drawingAhead.runInForeground(foreground.step, { onDone: () => { doneAt = fake.now().getTime(); } });
    drawingAhead.add(background.step);
    fake.advanceTime(2000);

    assert.equal(foreground.stepTimes.length, 30);
    assert.ok(background.stepTimes.length > 0, "the background work runs afterwards");
    assert.ok(background.stepTimes[0] >= doneAt, "never before the foreground work is over");
});

test("cancelled foreground work stops and is never told it is over", () => {
    const fake = createFakePinballYHost();
    const drawingAhead = createDrawingAhead(fake);
    fake.advanceTime(1000);
    const work = timedWork(fake, 30);
    let isDone = false;

    const cancel = drawingAhead.runInForeground(work.step, { onDone: () => { isDone = true; } });
    fake.advanceTime(1);
    const stepsBeforeCancel = work.stepTimes.length;
    cancel();
    fake.advanceTime(2000);

    assert.ok(stepsBeforeCancel > 0 && stepsBeforeCancel < 30);
    assert.equal(work.stepTimes.length, stepsBeforeCancel);
    assert.equal(isDone, false);
});

test("a failing foreground step is logged and gives the work up", () => {
    const fake = createFakePinballYHost();
    const drawingAhead = createDrawingAhead(fake);
    fake.advanceTime(1000);
    let steps = 0;
    let isDone = false;
    let isFailed = false;

    drawingAhead.runInForeground(() => {
        steps++;
        if (steps === 2) throw new Error("broken screen");
        return true;
    }, { onDone: () => { isDone = true; }, onFailed: () => { isFailed = true; } });
    fake.advanceTime(2000);

    assert.equal(steps, 2, "no step after the failing one");
    assert.equal(isFailed, true);
    assert.equal(isDone, false);
    assert.equal(fake.logLines().filter(line => line.startsWith("[DrawingAhead]") && line.includes("broken screen")).length, 1);
});
