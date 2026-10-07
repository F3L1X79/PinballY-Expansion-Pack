// ============================================================
// Profile Stats module: the drawn screen the player opens from the main
// menu to sum up the active Profile's own plays: a centred Steamball
// panel over the dimmed wheel, laid out by the Profile Stats painter,
// with the Avatar, the Profile's name, the Player Level and the
// Collection Mastery on a card whose foot holds the Achievements, Most
// Played Tables and Tables to Discover buttons, and the GAME section on
// its right. Every stat is read again on each opening; the screen is
// drawn at once on all its layers, then faded in. Created from the
// PinballY host, the Profile store, a reader of the active Profile's
// Player Level, the Achievement List (its counts, and opening it from
// the Achievements button, Exit there showing this screen again on that
// button) and the full ids of the Hall of Fame and Tables to Discover
// filters (null when their Add-on is disabled: no button). While open it
// swallows every button through "commandbuttondown": Next / Prev move a
// gold halo through the cross and the buttons, looping, with PinballY's
// navigation sound; Select runs the choice, Exit closes; attract mode
// closes it too. Opens directly, not through the wheel dialog module:
// the player asked for it.
// ============================================================

import lang from "./i18n.js";
import { displayNameOf } from "./profile_name.js";
import { safeHandler } from "./safe_handler.js";
import { tablesVisibleTo } from "./visible_tables.js";
import { collectionMasteryOfProfile } from "./table_mastery.js";
import { collectionTextsOf } from "./mastery_bar.js";
import { getHallOfFame } from "./hall_of_fame.js";
import { getTablesToDiscover } from "./tables_to_discover.js";
import { createNavigationSound } from "./navigation_sound.js";
import { STEAMBALL_COLORS } from "./steamball_palette.js";
import { PROFILE_STATS_Z_INDEX, REFERENCE_HEIGHT, CHOICE, drawBackdrop, layoutProfileStats } from "./profile_stats_painter.js";

const SCRIPT_NAME = "ProfileStats";
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const FADE_MS = 220;
const FRAME_MS = 16;

export function createProfileStats(host, {
    profileStore, readPlayerLevel, achievementList, hallOfFameFilter = null, tablesToDiscoverFilter = null,
}) {
    const { profileStats: TEXT } = lang;
    const navigationSound = createNavigationSound(host, SCRIPT_NAME);
    const log = message => host.log(`[${SCRIPT_NAME}] ${message}`);
    // The screen on show: its layers, choices and selection; null when closed.
    let shown = null;

    // Over every table the Profile played, hidden or no longer listed ones
    // included: hiding a table never erases a player's history.
    function sumPlays() {
        const plays = Object.values(profileStore.getProfileData().plays);
        return {
            count: plays.reduce((sum, play) => sum + play.count, 0),
            seconds: plays.reduce((sum, play) => sum + play.seconds, 0),
        };
    }

    const hoursAndMinutes = totalMinutes =>
        TEXT.hoursAndMinutes(Math.floor(totalMinutes / MINUTES_PER_HOUR), totalMinutes % MINUTES_PER_HOUR);

    // Minutes under an hour, else hours and minutes; rounded once, so 59 min
    // 40 s shows "1 h 00".
    function averageOf({ count, seconds }) {
        if (count === 0) return TEXT.none;
        const minutes = Math.round(seconds / count / SECONDS_PER_MINUTE);
        return minutes < MINUTES_PER_HOUR ? TEXT.minutes(minutes) : hoursAndMinutes(minutes);
    }

    // A selection button, left out when its Add-on is off or it has no table:
    // the player is never sent to an empty wheel.
    function selectionButton(choice, label, filterId, tables) {
        return filterId !== null && tables.length > 0 ? [{ choice, label, count: TEXT.number(tables.length), filterId }] : [];
    }

    function readScreen() {
        const profile = profileStore.getActiveProfile();
        const profileTables = tablesVisibleTo(host.getVisibleTables(), profileStore);
        const plays = sumPlays();
        const achievements = achievementList.countAll();
        const playerLevel = readPlayerLevel();
        const buttons = [
            { choice: CHOICE.ACHIEVEMENTS, label: TEXT.buttons.achievements, count: TEXT.achievementsCount(achievements.unlocked, achievements.total) },
            ...selectionButton(CHOICE.MOST_PLAYED, TEXT.buttons.mostPlayedTables, hallOfFameFilter, getHallOfFame(profileTables, profileStore.getPlay)),
            ...selectionButton(CHOICE.TO_DISCOVER, TEXT.buttons.tablesToDiscover, tablesToDiscoverFilter, getTablesToDiscover(profileTables, profileStore)),
        ];
        return {
            name: displayNameOf(profile),
            avatarPath: profile.avatarPath,
            playerLevel: {
                title: TEXT.playerLevel.title,
                number: String(playerLevel.level),
                share: (playerLevel.points - playerLevel.from) / (playerLevel.to - playerLevel.from),
                current: TEXT.playerLevel.current(TEXT.number(playerLevel.points), TEXT.number(playerLevel.to)),
            },
            // Over the tables the Profile can see; a tier it reached stays.
            collectionTitle: TEXT.collectionTitle,
            collection: collectionTextsOf(collectionMasteryOfProfile(profileTables, profileStore.getProfileData())),
            buttons,
            sections: [{
                title: TEXT.sections.game,
                rows: [[
                    { label: TEXT.stats.gamesPlayed, value: TEXT.number(plays.count) },
                    { label: TEXT.stats.totalTime, value: hoursAndMinutes(Math.floor(plays.seconds / SECONDS_PER_MINUTE)) },
                    { label: TEXT.stats.averageDuration, value: averageOf(plays) },
                ]],
            }],
            closeLabel: TEXT.closeTooltip,
            // The flippers' loop, the cross first.
            choices: [CHOICE.CLOSE, ...buttons.map(entry => entry.choice)],
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

    // Draws every layer at once, hidden, then fades them in together, like
    // the Welcome Screen: it never shows up half drawn.
    function open(selectedChoice = CHOICE.CLOSE) {
        if (shown) return;
        const openedAt = host.now().getTime();
        const screen = readScreen();
        const layers = [];
        // The backdrop first: it measures the window and dims the wheel.
        const backdrop = hiddenLayer(PROFILE_STATS_Z_INDEX.backdrop);
        let referenceWidth = 0;
        backdrop.draw(dc => {
            const size = dc.getSize();
            referenceWidth = REFERENCE_HEIGHT * size.width / size.height;
            drawBackdrop(dc, size, referenceWidth, screen);
        });
        layers.push(backdrop);
        const drawPiece = piece => {
            const layer = hiddenLayer(piece.zIndex);
            place(layer, piece.rect, referenceWidth);
            layer.draw(piece.draw, piece.rect.w, piece.rect.h);
            layers.push(layer);
            return layer;
        };
        const { pieces, highlights } = layoutProfileStats(host, screen, referenceWidth);
        pieces.forEach(drawPiece);
        const highlightLayers = screen.choices.map(choice => drawPiece(highlights[choice]));
        // Here rather than on the first move, which it would slow down.
        navigationSound.load();
        const selected = Math.max(0, screen.choices.indexOf(selectedChoice));
        shown = { screen, layers, highlightLayers, choices: screen.choices, selected, opacity: 0, fadeTimer: null };
        fadeIn(shown);
        log(`Opened, drawn in ${host.now().getTime() - openedAt} ms.`);
    }

    // Every layer but the unselected highlights, to the same opacity.
    function setOpacity(screen, opacity) {
        screen.opacity = opacity;
        const unselected = screen.highlightLayers.filter((layer, index) => index !== screen.selected);
        for (const layer of screen.layers) layer.alpha = unselected.includes(layer) ? 0 : opacity;
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
    }

    // direction: 1 for Next, -1 for Prev.
    function move(direction) {
        navigationSound.play();
        const count = shown.choices.length;
        shown.selected = (shown.selected + direction + count) % count;
        setOpacity(shown, shown.opacity);
    }

    function choose() {
        const choice = shown.choices[shown.selected];
        const entry = shown.screen.buttons.find(button => button.choice === choice);
        close();
        // Exit from the list comes back here, on its button.
        if (choice === CHOICE.ACHIEVEMENTS) achievementList.open(() => open(CHOICE.ACHIEVEMENTS));
        else if (entry) host.setCurrentFilter(entry.filterId);
    }

    // Fires on every mapped button press; drives the screen while it is open.
    host.on("commandbuttondown", safeHandler(SCRIPT_NAME, ev => {
        // Already handled: the Achievement List's Exit reopens this screen
        // within the same press, which must not close it again.
        if (!shown || ev.defaultPrevented) return;
        // Swallowed first, so a failing choice still never reaches the wheel.
        ev.preventDefault();
        if (ev.command === "Next" || ev.command === "Prev") move(ev.command === "Next" ? 1 : -1);
        else if (ev.command === "Select") choose();
        else if (ev.command === "Exit") close();
    }));

    // Fires when the cabinet sits idle: the screen must not stay over
    // attract mode nor keep the buttons.
    host.on("attractmodestart", safeHandler(SCRIPT_NAME, close));

    return { open: () => open() };
}
