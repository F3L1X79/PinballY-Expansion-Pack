// ============================================================
// Active-Profile badge, through main.js on the fake PinballY globals: the
// active Profile's Avatar and name drawn at the top right of the wheel
// screen (Guest's name translated), redrawn right after a switch, hidden
// while a game runs and shown again back on the wheel. Its proportions
// never depend on the window size at the time it was drawn (at startup the
// window is not laid out yet).
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";

const PROJECT_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack";
const PROFILES_FOLDER = `${PROJECT_FOLDER}\\profiles`;
const DEFAULT_AVATAR = `${PROJECT_FOLDER}\\assets\\images\\default_avatar.png`;
const ALICE_AVATAR = `${PROFILES_FOLDER}\\Alice\\avatar.png`;
const BADGE_Z = 4500;
const GAME = { id: 1, configId: "mm", title: "Medieval Madness" };

// The badge layer; above the wheel and game info box, under popups and menus.
function badge(fake) {
    const layers = fake.drawingLayers().filter(layer => layer.zIndex === BADGE_Z);
    assert.equal(layers.length, 1, "one badge layer");
    return layers[0];
}

const shows = (layer, { name, avatar }) =>
    layer.alpha > 0 && layer.texts().includes(name) && layer.images().includes(avatar);

test("the badge shows the active Profile, follows switches and hides during a game", async () => {
    const fake = createFakePinballYHost();
    fake.addFolder(`${PROFILES_FOLDER}\\Alice`);
    fake.addFile(ALICE_AVATAR, "png");
    fake.addFolder(`${PROFILES_FOLDER}\\Bob`);
    fake.setTables([GAME]);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "profilePicker";
    config.language = "en";

    const { default: lang } = await import("../common/i18n.js");
    const { getProfileStore } = await import("../common/profile_store.js");
    await import("../main.js");
    await settle();
    const store = getProfileStore();
    const guest = lang.profiles.guestName;

    // PinballY stretches a layer's canvas to the window: a canvas sized to
    // the startup window would be distorted once the window takes its size.
    const { width, height } = badge(fake).canvasSize();
    fake.setLayoutSize({ width: 1080, height: 1920 });
    const scale = badge(fake).scale();
    assert.equal(Object.keys(scale).length, 1, "only one span set, so the badge keeps its proportions");
    assert.ok(scale.ySpan > 0 && scale.ySpan < 0.2, "a small corner of the window");
    assert.ok(width < 400 && height < 400, "its own canvas, not the window's");
    assert.equal(badge(fake).position().align, "top right");

    assert.ok(shows(badge(fake), { name: guest, avatar: DEFAULT_AVATAR }), "Guest at startup, name translated");

    store.switchTo("Alice");
    assert.ok(shows(badge(fake), { name: "Alice", avatar: ALICE_AVATAR }), "redrawn right after a switch");
    assert.ok(!badge(fake).texts().includes(guest), "the previous Profile is gone");

    fake.gameStarted(GAME);
    assert.equal(badge(fake).alpha, 0, "hidden while a game runs");
    fake.gameOver(GAME);
    assert.ok(shows(badge(fake), { name: "Alice", avatar: ALICE_AVATAR }), "back on the wheel");

    store.switchTo("Bob");
    assert.ok(shows(badge(fake), { name: "Bob", avatar: DEFAULT_AVATAR }), "a Profile without an Avatar shows the default one");

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
