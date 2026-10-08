// ============================================================
// Sound paths tests: the five sound settings, from the defaults or a
// .env.local, may be relative to the pack's folder; absolute and network
// paths stay as they are, and an empty value still means no sound. Pure
// function; no PinballY host needed.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveSoundFiles } from "../common/config.js";

const PACK = "C:\\PinballY\\Scripts\\ExpansionPack";

test("a relative sound path is resolved from the pack's folder, with either slash", () => {
    const resolved = resolveSoundFiles({
        launchSoundFile: "assets\\sounds\\launch.mp3",
        achievementSoundFile: "assets/sounds/local/steam-achievement.mp3",
        profileGreetingSoundFile: ".\\assets\\sounds\\hello.mp3",
        confettiSoundFile: "assets\\sounds\\yay.mp3",
        fireworksSoundFile: "assets\\sounds\\fireworks.mp3",
    }, PACK);

    assert.deepEqual(resolved, {
        launchSoundFile: `${PACK}\\assets\\sounds\\launch.mp3`,
        achievementSoundFile: `${PACK}\\assets\\sounds\\local\\steam-achievement.mp3`,
        profileGreetingSoundFile: `${PACK}\\assets\\sounds\\hello.mp3`,
        confettiSoundFile: `${PACK}\\assets\\sounds\\yay.mp3`,
        fireworksSoundFile: `${PACK}\\assets\\sounds\\fireworks.mp3`,
    });
});

test("absolute and network paths are kept, an empty one still means no sound", () => {
    const resolved = resolveSoundFiles({
        launchSoundFile: "C:\\vPinball\\PinballY\\Media\\Sounds\\launch.mp3",
        achievementSoundFile: "d:/sounds/achievement.mp3",
        profileGreetingSoundFile: "\\\\cabinet\\sounds\\hello.mp3",
        confettiSoundFile: "",
        fireworksSoundFile: "",
    }, PACK);

    assert.deepEqual(resolved, {
        launchSoundFile: "C:\\vPinball\\PinballY\\Media\\Sounds\\launch.mp3",
        achievementSoundFile: "d:/sounds/achievement.mp3",
        profileGreetingSoundFile: "\\\\cabinet\\sounds\\hello.mp3",
        confettiSoundFile: "",
        fireworksSoundFile: "",
    });
});

test("the other settings are left untouched", () => {
    const config = { language: "fr", launchSoundFile: "", adultCategory: "assets\\NSFW", addOns: { clock: true } };
    assert.deepEqual(resolveSoundFiles(config, PACK), config);
});
