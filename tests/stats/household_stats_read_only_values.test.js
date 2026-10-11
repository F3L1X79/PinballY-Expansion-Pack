// ============================================================
// Another Profile's read-only Profile Stats, through main.js on the fake
// PinballY globals: the card and every section show exactly what that
// Profile's own Profile Stats show, its Period Table Streaks and tastes
// included, and none of the active Profile's.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold, errorLines, played, HOUR, MEDIEVAL, MARS, THEATRE } from "./household_stats_scenario.js";
import { openProfileStats, cardTexts, section, PROFILE_STATS_OPEN_MS } from "./profile_stats_reader.js";
import { openHouseholdStats, chooseColumn, press } from "./household_stats_reader.js";

// Past every toast a Profile switch brings.
const ALL_TOASTS_MS = 600000;

test("another Profile's read-only Profile Stats show its own values", async () => {
    const { fake, lang, profileStore } = await startHousehold({
        profiles: {
            Alice: { plays: { [MEDIEVAL.configId]: played(1, 600) } },
            Bob: {
                plays: { [THEATRE.configId]: played(4, 3 * HOUR), [MARS.configId]: played(2, HOUR) },
                playLog: ["2026-09-21T21:00:00", "2026-09-22T21:00:00"],
                // Alive: yesterday and this week.
                streaks: {
                    tableOfTheDay: { current: 3, longest: 5, lastPeriod: "2026-09-22", periodsPlayed: 7 },
                    tableOfTheWeek: { current: 2, longest: 2, lastPeriod: "2026-09-21", periodsPlayed: 2 },
                },
            },
        },
        active: "Bob",
    });
    const TEXT = lang.profileStats;
    const sectionsShown = () => Object.fromEntries([TEXT.sections.game, TEXT.sections.progression, TEXT.sections.tastes]
        .map(title => [title, section(fake, title, TEXT.stats)]));
    openProfileStats(fake, lang);
    const own = { card: cardTexts(fake), sections: sectionsShown() };
    press(fake, "Exit");
    assert.deepEqual(own.sections[TEXT.sections.progression][TEXT.stats.dayStreak], ["3", "Record: 5"], "a Streak to compare");

    profileStore.switchTo("Alice");
    fake.advanceTime(ALL_TOASTS_MS);
    openHouseholdStats(fake, lang);
    chooseColumn(fake, "Bob");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);

    assert.deepEqual(cardTexts(fake), own.card);
    assert.deepEqual(sectionsShown(), own.sections);
    assert.deepEqual(errorLines(fake), []);
});
