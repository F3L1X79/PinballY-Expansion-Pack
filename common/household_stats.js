// ============================================================
// Household Stats module: the drawn screen the player opens from the
// Profile Stats' "Household" button to set the Household's Profiles (every
// Profile but Guest) side by side: a centred Steamball panel over the
// dimmed wheel, laid out by the Household Stats painter, with one column
// per Profile (the active one first unless it is Guest, then the Profile
// picker's order) and one line per stat where more is better, the best of
// each line in gold. Every value is read again on each opening, through
// the Profile Stats' reader; the screen is drawn at once on all its
// layers, then faded in. While open it swallows every button through
// "commandbuttondown": Next / Prev move a gold halo from column to column,
// looping, with PinballY's navigation sound; Exit closes it and calls the
// return given to open(); attract mode only closes it. Opens directly, not
// through the wheel dialog module: the player asked for it. isOpen() and
// onClosed() let the wheel dialogs wait for it.
// ============================================================

import lang from "./i18n.js";
import { displayNameOf } from "./profile_name.js";
import { safeHandler } from "./safe_handler.js";
import { createClosedListeners } from "./closed_listeners.js";
import { createNavigationSound } from "./navigation_sound.js";
import { STEAMBALL_COLORS } from "./steamball_palette.js";
import { MAX_MASTERY_LEVEL } from "./table_mastery.js";
import { drawBackdrop } from "./steamball_drawing.js";
import {
    HOUSEHOLD_STATS_Z_INDEX, REFERENCE_HEIGHT, layoutHouseholdStats, haloRectOf, drawTitle, drawLabels, drawColumn, drawHalo,
} from "./household_stats_painter.js";

const SCRIPT_NAME = "HouseholdStats";
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const FADE_MS = 220;
const FRAME_MS = 16;

// readStats(profileName): the Profile Stats' values for that Profile
// (common/profile_stats.js); hasCollectionMastery: false without the
// Table Mastery Add-on, which takes the Collection Mastery line away.
export function createHouseholdStats(host, { profileStore, readStats, hasCollectionMastery = true }) {
    const { profileStats: TEXT } = lang;
    const navigationSound = createNavigationSound(host, SCRIPT_NAME);
    const log = message => host.log(`[${SCRIPT_NAME}] ${message}`);
    const closedListeners = createClosedListeners(SCRIPT_NAME);
    // The screen on show: its layers, columns' rects and selection; null when closed.
    let shown = null;

    // Every Profile but Guest, in the Profile picker's order, from either
    // of the store's lists: Guest always comes first in both.
    const householdOf = profiles => profiles.slice(1);

    const totalMinutesOf = seconds => Math.floor(seconds / SECONDS_PER_MINUTE);
    const hoursAndMinutes = totalMinutes =>
        TEXT.hoursAndMinutes(Math.floor(totalMinutes / MINUTES_PER_HOUR), totalMinutes % MINUTES_PER_HOUR);

    // The Collection Tier's progress, or the last tier's name once reached.
    function collectionValue({ tier, reached, needed }) {
        return tier >= MAX_MASTERY_LEVEL ? lang.tableMastery.levelNames[tier - 1] : TEXT.fraction(reached, needed);
    }

    // Each line top down: its label, whether it shows, and for one
    // Profile's stats its cell (value and Collection Tier) and its score,
    // compared element by element, all zeros meaning nothing yet.
    const LINES = [
        { label: TEXT.household.lines.playerLevel, isShown: () => true,
            cellOf: ({ playerLevel }) => ({ value: TEXT.number(playerLevel.level) }),
            // A level is never 0, but its points are before any Unlock.
            scoreOf: ({ playerLevel }) => (playerLevel.points === 0 ? [0] : [playerLevel.level, playerLevel.points]) },
        { label: TEXT.household.lines.collectionMastery, isShown: () => hasCollectionMastery,
            cellOf: ({ collectionMastery }) => ({ value: collectionValue(collectionMastery), tier: collectionMastery.tier }),
            scoreOf: ({ collectionMastery }) => [collectionMastery.tier, collectionMastery.reached] },
        { label: TEXT.household.lines.achievementsUnlocked, isShown: () => true,
            cellOf: ({ achievements }) => ({ value: TEXT.fraction(achievements.unlocked, achievements.total) }),
            scoreOf: ({ achievements }) => [achievements.unlocked] },
        { label: TEXT.stats.gamesPlayed, isShown: () => true,
            cellOf: ({ plays }) => ({ value: TEXT.number(plays.count) }),
            scoreOf: ({ plays }) => [plays.count] },
        // Compared on the minutes shown, so two equal times are both gold.
        { label: TEXT.stats.totalTime, isShown: () => true,
            cellOf: ({ plays }) => ({ value: hoursAndMinutes(totalMinutesOf(plays.seconds)) }),
            scoreOf: ({ plays }) => [totalMinutesOf(plays.seconds)] },
        { label: TEXT.household.lines.dailyStreak, isShown: () => true,
            cellOf: ({ dailyStreak }) => ({ value: TEXT.number(dailyStreak.current) }),
            scoreOf: ({ dailyStreak }) => [dailyStreak.current] },
        // Null without the Challenges Add-on.
        { label: TEXT.stats.challengesCompleted, isShown: stats => stats.challenges !== null,
            cellOf: ({ challenges }) => ({ value: TEXT.fraction(challenges.completed, challenges.total) }),
            scoreOf: ({ challenges }) => [challenges.completed] },
    ];

    // Positive when a is the better score.
    function compareScores(a, b) {
        for (let index = 0; index < Math.max(a.length, b.length); index++) {
            const difference = (a[index] || 0) - (b[index] || 0);
            if (difference !== 0) return difference;
        }
        return 0;
    }

    // The Profile's Avatar; null, logged, when its image is missing.
    function avatarOf(profile) {
        if (host.files.isImageReadable(profile.avatarPath)) return profile.avatarPath;
        log(`${profile.avatarPath} is missing or unreadable; ${profile.name}'s column shows without an Avatar.`);
        return null;
    }

    function readScreen() {
        const active = profileStore.getActiveProfile();
        const household = householdOf(profileStore.listProfiles());
        const isActive = profile => profile.name.toLowerCase() === active.name.toLowerCase();
        const profiles = [...household.filter(isActive), ...household.filter(profile => !isActive(profile))];
        const allStats = profiles.map(profile => readStats(profile.name));
        const lines = LINES.filter(line => allStats.every(stats => line.isShown(stats)));
        const goldByLine = lines.map(line => {
            const scores = allStats.map(line.scoreOf);
            const best = scores.reduce((top, score) => (compareScores(score, top) > 0 ? score : top));
            const isNothing = best.every(value => value === 0);
            return scores.map(score => !isNothing && compareScores(score, best) === 0);
        });
        return {
            title: TEXT.household.title,
            labels: lines.map(line => line.label),
            columns: profiles.map((profile, column) => ({
                name: displayNameOf(profile),
                avatarPath: avatarOf(profile),
                cells: lines.map((line, index) => ({ ...line.cellOf(allStats[column]), isGold: goldByLine[index][column] })),
            })),
        };
    }

    function place(layer, rect, referenceWidth) {
        layer.setScale({ ySpan: rect.h / REFERENCE_HEIGHT });
        layer.setPos((rect.x + rect.w / 2) / referenceWidth - 0.5, 0.5 - (rect.y + rect.h / 2) / REFERENCE_HEIGHT);
    }

    function hiddenLayer(zIndex) {
        const layer = host.createDrawingLayer(zIndex);
        layer.alpha = 0;
        layer.clear(STEAMBALL_COLORS.transparent);
        return layer;
    }

    // onBack: what Exit returns to, called once the screen is closed. Draws
    // every layer at once, hidden, then fades them in together, like the
    // Profile Stats: it never shows up half drawn.
    function open(onBack = () => {}) {
        if (shown) return;
        const openedAt = host.now().getTime();
        const screen = readScreen();
        const layers = [];
        // The backdrop first: it measures the window and dims the wheel.
        const backdrop = hiddenLayer(HOUSEHOLD_STATS_Z_INDEX.backdrop);
        let referenceWidth = 0;
        let geometry = null;
        backdrop.draw(dc => {
            const size = dc.getSize();
            referenceWidth = REFERENCE_HEIGHT * size.width / size.height;
            geometry = layoutHouseholdStats(referenceWidth, screen.columns.length, screen.labels.length);
            drawBackdrop(dc, size, REFERENCE_HEIGHT, geometry.panel);
        });
        layers.push(backdrop);
        const drawPiece = (zIndex, rect, draw) => {
            const layer = hiddenLayer(zIndex);
            place(layer, rect, referenceWidth);
            layer.draw(draw, rect.w, rect.h);
            layers.push(layer);
            return layer;
        };
        drawPiece(HOUSEHOLD_STATS_Z_INDEX.title, geometry.title, dc => drawTitle(host, dc, screen.title, geometry.title.w, geometry.title.h));
        drawPiece(HOUSEHOLD_STATS_Z_INDEX.labels, geometry.labels, dc => drawLabels(host, dc, screen.labels, geometry.labels.w));
        screen.columns.forEach((column, index) => {
            const rect = geometry.columns[index];
            drawPiece(HOUSEHOLD_STATS_Z_INDEX.columns, rect, dc => drawColumn(host, dc, column, rect.w));
        });
        // Drawn once for the columns' size and only moved.
        const haloRect = haloRectOf(geometry.columns[0]);
        const halo = drawPiece(HOUSEHOLD_STATS_Z_INDEX.highlight, haloRect, dc => drawHalo(dc, haloRect.w, haloRect.h));
        // Here rather than on the first move, which it would slow down.
        navigationSound.load();
        shown = { onBack, layers, halo, geometry, referenceWidth, selected: 0, opacity: 0, fadeTimer: null };
        fadeIn(shown);
        log(`Opened, drawn in ${host.now().getTime() - openedAt} ms.`);
    }

    function setOpacity(screen, opacity) {
        screen.opacity = opacity;
        for (const layer of screen.layers) layer.alpha = opacity;
    }

    function fadeIn(screen) {
        const startMs = host.now().getTime();
        // Timed on the clock: Windows timers fire late.
        screen.fadeTimer = host.setInterval(safeHandler(SCRIPT_NAME, () => {
            const opacity = Math.min(1, (host.now().getTime() - startMs) / FADE_MS);
            setOpacity(screen, opacity);
            if (opacity >= 1) stopFade(screen);
        }), FRAME_MS);
    }

    function stopFade(screen) {
        host.clearInterval(screen.fadeTimer);
        screen.fadeTimer = null;
    }

    function close() {
        if (!shown) return;
        stopFade(shown);
        for (const layer of shown.layers) host.removeDrawingLayer(layer);
        shown = null;
        closedListeners.tell();
    }

    // direction: 1 for Next, -1 for Prev.
    function move(direction) {
        navigationSound.play();
        const { columns } = shown.geometry;
        shown.selected = (shown.selected + direction + columns.length) % columns.length;
        place(shown.halo, haloRectOf(columns[shown.selected]), shown.referenceWidth);
    }

    function back() {
        const { onBack } = shown;
        close();
        onBack();
    }

    // Fires on every mapped button press; drives the screen while it is open.
    host.on("commandbuttondown", safeHandler(SCRIPT_NAME, ev => {
        // Already handled: the Profile Stats' button opened this screen
        // within the same press, which must not act here too.
        if (!shown || ev.defaultPrevented) return;
        // Swallowed first, so a failing move still never reaches the wheel.
        ev.preventDefault();
        if (ev.command === "Next" || ev.command === "Prev") move(ev.command === "Next" ? 1 : -1);
        else if (ev.command === "Exit") back();
    }));

    // Fires when the cabinet sits idle: the screen must not stay over
    // attract mode nor keep the buttons.
    host.on("attractmodestart", safeHandler(SCRIPT_NAME, close));

    return {
        open,
        // Whether the Household has two Profiles to set side by side.
        // By name only: listing the Profiles also checks their Avatars.
        isOffered: () => householdOf(profileStore.listProfileNames()).length >= 2,
        isOpen: () => shown !== null,
        onClosed: closedListeners.onClosed,
    };
}
