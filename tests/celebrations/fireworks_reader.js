// ============================================================
// Reads the Fireworks on the fake PinballY host: their main-window layers,
// how many show, and their log lines. Never loaded by PinballY.
// ============================================================

import { FIREWORKS_Z_INDEX } from "../../common/fireworks.js";

export const fireworksLayers = fake => fake.drawingLayers().filter(layer => layer.zIndex === FIREWORKS_Z_INDEX);
export const visibleFireworksCount = fake => fireworksLayers(fake).filter(layer => layer.alpha > 0).length;
export const fireworksStartLogs = fake => fake.logLines().filter(line => line.startsWith("[Fireworks] Started"));
export const fireworksNotStartedLogs = fake => fake.logLines().filter(line => line.startsWith("[Fireworks] Not started"));
// Each ended show's bursts, by colour scheme number, as its log line gives them.
export const fireworksSchemes = fake => fake.logLines()
    .filter(line => line.startsWith("[Fireworks] Ended"))
    .map(line => (line.match(/colour schemes ([\d, ]+)\./) || [null, ""])[1].split(", ").filter(Boolean).map(Number));
