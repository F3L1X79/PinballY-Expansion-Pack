// ============================================================
// Household Stats module: the drawn screen the player opens from the
// Profile Stats' "Household Stats" button to set the Household's Profiles (every
// Profile but Guest) side by side: a centred Steamball panel over the
// dimmed wheel, laid out by the Household Stats painter, with one column
// per Profile (its Avatar in the Avatar Frame it wears; the active one
// first unless it is Guest, then the Profile picker's order) and one line
// per stat where more is better, the best of each line in gold. Every
// value is read again on each opening, through the Profile Stats' reader;
// the screen is drawn at once on all its layers, then faded in. While open
// it swallows every button through "commandbuttondown": Next / Prev move
// the Selection Marker (a gold glow flowing round the choice) through the
// cross at the top right (its tooltip says Back), then from column to
// column, looping, with PinballY's navigation sound. Past five columns
// (fewer in a narrow window), the columns glide sideways to keep the
// marker in view, the marker following its column on every frame, the ones cut by the view's edges
// faded, and coming from the cross jumps instead of gliding across them
// all. Select or Launch on another Profile's column opens its Profile
// Stats read-only, whose Exit shows this screen again on that column; on
// one's own column or the cross it goes back as Exit does. Exit closes it
// and calls the return given to open(); attract mode only closes it. Opens directly, not through the
// wheel dialog module: the player asked for it. isOpen() and onClosed()
// let the wheel dialogs wait for it.
// ============================================================

import lang from "../core/i18n.js";
import { displayNameOf } from "../profiles/profile_name.js";
import { safeHandler } from "../core/safe_handler.js";
import { createClosedListeners } from "../core/closed_listeners.js";
import { createNavigationSound } from "../core/navigation_sound.js";
import { openDrawnScreen, FRAME_MS } from "./drawn_screen.js";
import { MAX_MASTERY_LEVEL } from "../mastery/table_mastery.js";
import { drawBackdrop } from "../drawing/steamball_drawing.js";
import { createSelectionMarker } from "../drawing/selection_marker.js";
import {
    HOUSEHOLD_STATS_Z_INDEX, REFERENCE_HEIGHT, AVATAR_FRAME_WIDTH, layoutHouseholdStats, crossTooltipRectOf,
    drawTitle, drawLabels, drawColumn, drawCross, drawCrossTooltip,
} from "./household_stats_painter.js";

const SCRIPT_NAME = "HouseholdStats";
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
// The sideways glide slows down as it arrives (exponential ease-out), as
// the Achievement List's does.
const GLIDE_TIME_CONSTANT_MS = 40;
const GLIDE_SNAP_PX = 0.5;
// The selection on the cross rather than on a column; first in the
// Next / Prev loop, as on the Profile Stats.
const CROSS = -1;

// readStats(profileName): the Profile Stats' values for that Profile
// (common/stats/profile_stats.js); openProfileStats(profileName, onBack): opens
// that Profile's Profile Stats, read-only, onBack called on its Exit;
// profileRewards: the worn Avatar Frames (null: none);
// hasCollectionMastery: false without the Table Mastery Add-on, which
// takes the Collection Mastery line away.
export function createHouseholdStats(host, { profileStore, readStats, openProfileStats, profileRewards = null, hasCollectionMastery = true }) {
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
        // Null without the High Scores Add-on.
        { label: TEXT.stats.tableRecordsHeld, isShown: stats => stats.boards !== null,
            cellOf: ({ boards }) => ({ value: TEXT.number(boards.tableRecords) }),
            scoreOf: ({ boards }) => [boards.tableRecords] },
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
            backLabel: TEXT.backTooltip,
            labels: lines.map(line => line.label),
            columns: profiles.map((profile, column) => ({
                profileName: profile.name,
                isActive: isActive(profile),
                name: displayNameOf(profile),
                avatarPath: avatarOf(profile),
                framePath: profileRewards ? profileRewards.wornImageOf(profile.name, AVATAR_FRAME_WIDTH) : null,
                cells: lines.map((line, index) => ({ ...line.cellOf(allStats[column]), isGold: goldByLine[index][column] })),
            })),
        };
    }

    // onBack: what Exit returns to, called once the screen is closed;
    // selectedName: the Profile whose column the marker surrounds, brought
    // into view (the first column when null or no longer there). Draws every
    // layer at once, hidden, then fades them in together, like the Profile
    // Stats: it never shows up half drawn.
    function open(onBack = () => {}, selectedName = null) {
        if (shown) return;
        const openedAt = host.now().getTime();
        const screen = readScreen();
        const readAt = host.now().getTime();
        let geometry = null;
        const drawn = openDrawnScreen(host, SCRIPT_NAME, {
            referenceHeight: REFERENCE_HEIGHT,
            backdropZIndex: HOUSEHOLD_STATS_Z_INDEX.backdrop,
            drawBackdrop(dc, size, referenceWidth) {
                geometry = layoutHouseholdStats(referenceWidth, screen.columns.length, screen.labels.length);
                drawBackdrop(dc, size, REFERENCE_HEIGHT, geometry.panel);
            },
        });
        drawn.drawPiece(HOUSEHOLD_STATS_Z_INDEX.title, geometry.title, dc => drawTitle(host, dc, screen.title, geometry.title.w, geometry.title.h));
        drawn.drawPiece(HOUSEHOLD_STATS_Z_INDEX.cross, geometry.cross, drawCross);
        drawn.drawPiece(HOUSEHOLD_STATS_Z_INDEX.labels, geometry.labels, dc => drawLabels(host, dc, screen.labels, geometry.labels.w));
        // Apart from the other layers: their alpha also fades them at the view's edges.
        const columnLayers = [];
        screen.columns.forEach((column, index) => {
            const rect = geometry.columns[index];
            drawn.drawPiece(HOUSEHOLD_STATS_Z_INDEX.columns, rect, dc => drawColumn(host, dc, column, rect.w), columnLayers);
        });
        const crossTooltip = drawn.drawPiece(HOUSEHOLD_STATS_Z_INDEX.tooltip, crossTooltipRectOf(geometry.cross), dc => drawCrossTooltip(host, dc, screen.backLabel));
        const marker = createSelectionMarker(host, { zIndex: HOUSEHOLD_STATS_Z_INDEX.marker, referenceWidth: drawn.referenceWidth, referenceHeight: REFERENCE_HEIGHT });
        // Here rather than on the first move, which it would slow down.
        navigationSound.load();
        const column = Math.max(0, screen.columns.findIndex(entry => entry.profileName === selectedName));
        const first = Math.max(0, column - geometry.view.count + 1);
        // first: the first column in view once the glide is over; scroll:
        // how far the columns have glided, in reference pixels.
        const opened = {
            onBack, columns: screen.columns, drawn, columnLayers, crossTooltip, marker, marked: null, geometry, selected: column, first, scroll: first * geometry.pitch,
            opacity: 0, glideTimer: null, glideMs: 0,
        };
        shown = opened;
        placeColumns(opened);
        drawn.fadeIn(opacity => setOpacity(opened, opacity));
        const drawnAt = host.now().getTime();
        log(`Opened in ${drawnAt - openedAt} ms: read in ${readAt - openedAt} ms, drawn in ${drawnAt - readAt} ms.`);
    }

    // Where the columns glide to: the first one in view at the view's left.
    const targetScroll = screen => screen.first * screen.geometry.pitch;

    // A column's alpha by how much of it the view cuts off: gone once half
    // of it is cut, so a column leaving never shows much over the labels
    // or past the panel, which nothing masks.
    function edgeAlpha({ view }, x, w) {
        const share = (Math.min(x + w, view.x + view.w) - Math.max(x, view.x)) / w;
        return Math.max(0, Math.min(1, 2 * share - 1));
    }

    // Each column at the glide's scroll, faded at the view's edges; the
    // marker on the selected column, held inside the view while that column
    // glides into it, or on the cross with its tooltip.
    function placeColumns(screen) {
        const { geometry, drawn } = screen;
        const { view } = geometry;
        screen.columnLayers.forEach((layer, index) => {
            const rect = geometry.columns[index];
            const x = rect.x - screen.scroll;
            drawn.place(layer, { ...rect, x });
            layer.alpha = screen.opacity * edgeAlpha(geometry, x, rect.w);
        });
        const isOnCross = screen.selected === CROSS;
        screen.crossTooltip.alpha = isOnCross ? screen.opacity : 0;
        let marked = geometry.cross;
        if (!isOnCross) {
            const selected = geometry.columns[screen.selected];
            const x = Math.max(view.x, Math.min(view.x + view.w - selected.w, selected.x - screen.scroll));
            marked = { ...selected, x };
        }
        // Only when it moved: a fade frame changes no more than the alpha,
        // and the marker's own tick redraws it anyway.
        const isMoved = !screen.marked || ["x", "y", "w", "h"].some(key => marked[key] !== screen.marked[key]);
        if (isMoved) screen.marker.moveTo(marked);
        screen.marked = marked;
    }

    function setOpacity(screen, opacity) {
        screen.opacity = opacity;
        for (const layer of screen.drawn.layers) layer.alpha = opacity;
        screen.marker.setOpacity(opacity);
        placeColumns(screen);
    }

    function stopGlide(screen) {
        host.clearInterval(screen.glideTimer);
        screen.glideTimer = null;
    }

    // Runs every frame while the columns glide; timed on the clock, since
    // Windows timers fire late.
    function glideStep(screen) {
        const nowMs = host.now().getTime();
        const target = targetScroll(screen);
        screen.scroll = target + (screen.scroll - target) * Math.exp(-(nowMs - screen.glideMs) / GLIDE_TIME_CONSTANT_MS);
        screen.glideMs = nowMs;
        if (Math.abs(screen.scroll - target) < GLIDE_SNAP_PX) {
            screen.scroll = target;
            stopGlide(screen);
        }
        placeColumns(screen);
    }

    function close() {
        if (!shown) return;
        stopGlide(shown);
        shown.marker.remove();
        shown.drawn.close(shown.columnLayers);
        shown = null;
        closedListeners.tell();
    }

    // direction: 1 for Next, -1 for Prev, through the cross then each
    // column. Brings the selected column into view, gliding unless it comes
    // from the cross: the columns then stay where they were.
    function move(direction) {
        navigationSound.play();
        const screen = shown;
        const { columns, view } = screen.geometry;
        const previous = screen.selected;
        // The loop's places: the cross at 0, then the columns.
        const places = columns.length + 1;
        screen.selected = ((previous + 1 + direction + places) % places) - 1;
        if (screen.selected === CROSS) return placeColumns(screen);
        screen.first = Math.min(screen.selected, Math.max(screen.first, screen.selected - view.count + 1));
        if (previous === CROSS) {
            stopGlide(screen);
            screen.scroll = targetScroll(screen);
        } else if (screen.glideTimer === null && screen.scroll !== targetScroll(screen)) {
            screen.glideMs = host.now().getTime();
            screen.glideTimer = host.setInterval(safeHandler(SCRIPT_NAME, () => glideStep(screen)), FRAME_MS);
        }
        placeColumns(screen);
    }

    function back() {
        const { onBack } = shown;
        close();
        onBack();
    }

    // Another Profile's column opens its Profile Stats, whose Exit comes
    // back here on that column; one's own and the cross go back as Exit does.
    function choose() {
        const { onBack, columns, selected } = shown;
        if (selected === CROSS) return back();
        const column = columns[selected];
        if (column.isActive) return back();
        close();
        openProfileStats(column.profileName, () => open(onBack, column.profileName));
    }

    // Fires on every mapped button press; drives the screen while it is open.
    host.on("commandbuttondown", safeHandler(SCRIPT_NAME, ev => {
        // Already handled: the Profile Stats' button or Exit opened this
        // screen within the same press, which must not act here too.
        if (!shown || ev.defaultPrevented) return;
        // Swallowed first, so a failing move still never reaches the wheel.
        ev.preventDefault();
        if (ev.command === "Next" || ev.command === "Prev") move(ev.command === "Next" ? 1 : -1);
        // Launch is the plunger, which selects in PinballY's own menus too.
        else if (ev.command === "Select" || ev.command === "Launch") choose();
        else if (ev.command === "Exit") back();
    }));

    // Fires when the cabinet sits idle: the screen must not stay over
    // attract mode nor keep the buttons.
    host.on("attractmodestart", safeHandler(SCRIPT_NAME, close));

    return {
        open,
        // How many Profiles the screen sets side by side; offered from two.
        // By name only: listing the Profiles also checks their Avatars.
        countProfiles: () => householdOf(profileStore.listProfileNames()).length,
        isOpen: () => shown !== null,
        onClosed: closedListeners.onClosed,
    };
}
