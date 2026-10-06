// ============================================================
// The Tables to Discover filter, through main.js on the fake PinballY
// globals: the wheel shows the active Profile's visible, configured, never
// played tables by title, drops a table the next time it is shown after
// its first Play, and follows a Profile switch or a Profile Reset while it
// is on the wheel.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";

const NOW = new Date(2026, 9, 6, 20, 0, 0);
const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const TABLES_TO_DISCOVER_FULL_FILTER_ID = "User.project.TablesToDiscover";

// PinballY's own play stats are ignored: only the Profile's plays count.
function table(id, title, { isHidden = false, isConfigured = true } = {}) {
    return { id, configId: title, title, playCount: 3, playTime: 900, isHidden, isConfigured, categories: [] };
}

const MEDIEVAL = table(1, "Medieval Madness");
const TWILIGHT = table(2, "Twilight Zone");
const MARS = table(3, "Attack from Mars");
const BLACK_KNIGHT = table(4, "Black Knight");
const HIDDEN = table(5, "Hidden Table", { isHidden: true });
const UNCONFIGURED = table(6, "Unconfigured Table", { isConfigured: false });

const play = (count, seconds) => ({ count, seconds, lastPlayed: "2026-10-01T20:00:00" });

function seedProfile(fake, name, data) {
    fake.addFile(`${PROFILES_FOLDER}\\${name}\\profile.json`, JSON.stringify({ version: 1, ...data }));
}

const wheelTitles = fake => fake.getWheelTables().map(game => game.title);

test("Tables to Discover shows the never played tables by title, and follows Plays, switches and resets", async () => {
    const fake = createFakePinballYHost({
        now: NOW, tables: [MEDIEVAL, TWILIGHT, MARS, BLACK_KNIGHT, HIDDEN, UNCONFIGURED],
    });
    seedProfile(fake, "guest", { plays: { [MEDIEVAL.configId]: play(2, 3600) } });
    seedProfile(fake, "Alice", { isAdmin: true, plays: { [MARS.configId]: play(1, 600), [TWILIGHT.configId]: play(1, 600) } });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = key === "tablesToDiscover";
    }
    config.language = "en";

    const { getProfileStore } = await import("../common/profile_store.js");
    await import("../main.js");
    await settle();

    fake.selectFilter(TABLES_TO_DISCOVER_FULL_FILTER_ID);
    assert.deepEqual(wheelTitles(fake), ["Attack from Mars", "Black Knight", "Twilight Zone"], "Guest's tables to discover");

    fake.gameStarted(BLACK_KNIGHT);
    await settle();
    fake.advanceTime(90 * 1000);
    fake.gameOver(BLACK_KNIGHT);
    await settle();
    fake.selectFilter(TABLES_TO_DISCOVER_FULL_FILTER_ID);
    assert.deepEqual(wheelTitles(fake), ["Attack from Mars", "Twilight Zone"], "gone after its first Play");

    getProfileStore().switchTo("Alice");
    await settle();
    assert.deepEqual(wheelTitles(fake), ["Black Knight", "Medieval Madness"], "Alice's tables, at once");

    getProfileStore().resetProfile("Alice");
    await settle();
    assert.deepEqual(wheelTitles(fake), ["Attack from Mars", "Black Knight", "Medieval Madness", "Twilight Zone"],
        "every table again after her reset");

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
