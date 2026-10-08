// ============================================================
// Wheel Arc, through main.js on the fake PinballY globals, on a cabinet
// whose player has their own underlay in PinballY's media folder: theirs
// stays, at startup and on every table, and so does a system's underlay.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";

const PLAYER_UNDERLAY = "C:\\PinballY\\Media\\Images\\underlay.png";
const SYSTEM_UNDERLAY = "C:\\PinballY\\Media\\System Underlays\\Visual Pinball X.png";

test("a player's own underlay or a system's underlay is never replaced by the Wheel Arc", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 8, 20, 0, 0) });
    fake.addFile("C:\\PinballY\\Scripts\\ExpansionPack\\assets\\images\\wheel_arc.png");
    fake.addFile("C:\\PinballY\\Assets\\Images\\underlay.png");
    fake.addFile(PLAYER_UNDERLAY);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "wheelArc";

    await import("../main.js");
    await settle();

    assert.equal(fake.underlay(), null, "PinballY's choice left alone at startup");
    assert.equal(fake.fire("underlaychange", { filename: PLAYER_UNDERLAY }).filename, PLAYER_UNDERLAY);
    assert.equal(fake.fire("underlaychange", { filename: SYSTEM_UNDERLAY }).filename, SYSTEM_UNDERLAY);
});
