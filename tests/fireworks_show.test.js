// ============================================================
// Fireworks module on the fake host, drawn ahead by hand: a start while a
// show plays does nothing; the show vanishes at once on attract mode, a
// table launch ("prelaunch") and a started game; two bursts in a row never
// share a colour scheme, from one show to the next too; no layer waits as
// a hidden layer the size of the window.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "./fake_pinbally_host.js";
import { createFireworks } from "../common/fireworks.js";
import { fireworksLayers, visibleFireworksCount, fireworksStartLogs, fireworksSchemes } from "./fireworks_reader.js";

const SHOW_MS = 10000;
const FRAME_MS = 16;

function readyFireworks() {
    const fake = createFakePinballYHost();
    let drawStep = null;
    const fireworks = createFireworks(fake, { drawingAhead: { add(step) { drawStep = step; return () => {}; } } });
    while (drawStep());
    return { fake, fireworks };
}

function play(fake, ms) {
    for (let elapsedMs = 0; elapsedMs < ms; elapsedMs += FRAME_MS) fake.advanceTime(FRAME_MS);
}

test("a start while a show plays does nothing", () => {
    const { fake, fireworks } = readyFireworks();
    fireworks.start();
    play(fake, 2000);
    fireworks.start();
    play(fake, SHOW_MS);

    assert.deepEqual(fireworksStartLogs(fake), ["[Fireworks] Started with 7 rockets."]);
    assert.equal(fireworksSchemes(fake).length, 1, "one show");
    assert.equal(fireworksSchemes(fake)[0].length, 7, "seven bursts");
    assert.equal(visibleFireworksCount(fake), 0);
    assert.equal(fake.runningIntervalCount(), 0);
});

test("the show vanishes at once on attract mode, a table launch and a started game", () => {
    const { fake, fireworks } = readyFireworks();
    const stops = [
        ["attractmodestart", () => fake.fire("attractmodestart")],
        ["prelaunch", () => fake.fire("prelaunch", { game: null })],
        ["gamestarted", () => fake.fire("gamestarted", { game: null })],
    ];
    for (const [label, stopShow] of stops) {
        fireworks.start();
        // Rockets in flight and a burst playing.
        play(fake, 2000);
        assert.ok(visibleFireworksCount(fake) > 0, `the show plays before ${label}`);
        stopShow();
        assert.equal(visibleFireworksCount(fake), 0, `everything hidden at once on ${label}`);
        assert.equal(fake.runningIntervalCount(), 0, `no frame timer left after ${label}`);
    }
    assert.equal(fireworksStartLogs(fake).length, 3, "a stopped show lets the next one start");
});

test("two bursts in a row never share a colour scheme, from one show to the next too", () => {
    const { fake, fireworks } = readyFireworks();
    for (let show = 0; show < 6; show++) {
        fireworks.start();
        play(fake, SHOW_MS);
    }
    const bursts = fireworksSchemes(fake).flat();
    assert.equal(bursts.length, 6 * 7);
    assert.ok(bursts.every(scheme => scheme >= 1 && scheme <= 4), "four colour schemes");
    bursts.slice(1).forEach((scheme, index) => assert.notEqual(scheme, bursts[index], `bursts ${index + 1} and ${index + 2}`));
    assert.equal(new Set(bursts).size, 4, "every scheme shows");
});

// See the same test in confetti_shower_pool.test.js.
test("no layer waits as a hidden layer the size of the window, before or after a show", () => {
    const { fake, fireworks } = readyFireworks();
    const spansWindow = layer => layer.scale().xSpan >= 1 || layer.scale().ySpan >= 1;
    const fullWindowHidden = () => fireworksLayers(fake).filter(layer => layer.alpha === 0 && spansWindow(layer));
    assert.equal(fullWindowHidden().length, 0, "drawn ahead");

    fireworks.start();
    play(fake, SHOW_MS);
    assert.equal(fullWindowHidden().length, 0, "after the show");
});
