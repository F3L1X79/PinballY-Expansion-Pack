// ============================================================
// The Holiday Frames in French, through main.js on the fake PinballY
// globals: each locked row of the frame list shows its unlock condition,
// then the toast after a Play on Christmas Eve names Christmas.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import config from "../../common/core/config.js";

// Before anything loads the texts: the language is read once.
config.language = "fr";
const { startScenario, allToasts, play, TABLES, MINUTE, ALL_TOASTS_MS, DRAWN_AHEAD_MS } = await import("../mastery/mastery_bar_scenario.js");
const { openProfileStats, choose, frameRows, press, PROFILE_STATS_OPEN_MS } = await import("../stats/profile_stats_reader.js");
const { assertNoErrorLogged } = await import("../support/error_log.js");
const { default: lang } = await import("../../common/core/i18n.js");

const CHRISTMAS_EVE = new Date(2026, 11, 24, 19, 0, 0);

test("en français : la ligne verrouillée de Noël, puis son toast", async () => {
    const fake = await startScenario({
        addOns: ["achievements", "customMenuCommands", "profilePicker"], frameImages: true, now: CHRISTMAS_EVE, language: "fr",
        profiles: { guest: { avatarFrame: null } },
    });
    fake.advanceTime(DRAWN_AHEAD_MS);

    openProfileStats(fake, lang);
    choose(fake, lang.profileStats.buttons.frame);
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.deepEqual(frameRows(fake).map(row => [row.name, row.status, row.frame]), [
        ["Jour de l'An", "Une partie le 1er janvier", "frame_newYear_192_locked.png"],
        ["Saint-Valentin", "Une partie le 14 février", "frame_valentine_192_locked.png"],
        ["Saint-Patrick", "Une partie le 17 mars", "frame_stPatrick_192_locked.png"],
        ["Fête de la Musique", "Une partie le 21 juin", "frame_musicDay_192_locked.png"],
        ["Halloween", "Une partie le 31 octobre", "frame_halloween_192_locked.png"],
        ["Día de los Muertos", "Une partie le 1er ou le 2 novembre", "frame_deadDay_192_locked.png"],
        ["Noël", "Une partie le 24 ou le 25 décembre", "frame_christmas_192_locked.png"],
        ["Aucun", "Porté", null],
    ]);
    press(fake, "Exit");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    press(fake, "Exit");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);

    await play(fake, TABLES[0], 10 * MINUTE);
    fake.advanceTime(ALL_TOASTS_MS);
    assert.deepEqual(allToasts(fake).filter(texts => texts.startsWith("CADRE DE FÊTE")), [
        "CADRE DE FÊTE | Nouveau cadre : Noël | Une partie le 24 ou le 25 décembre",
    ]);
    assertNoErrorLogged(fake);
});
