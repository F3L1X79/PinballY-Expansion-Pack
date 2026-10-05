// ============================================================
// Welcome Screen: at startup, a centred Steamball panel drawn over the
// dimmed wheel greets the active Profile by the hour (its Avatar and its
// name in gold when the Profile picker is on) and offers to close, to
// play the Table of the Day or of the Week (one card each, with its Table
// Mastery and the active Profile's Streak; reading them picks and locks
// this Period's tables, and Select launches one), to stay on the Last
// Played Table or to launch a Random Game. It is a drawn
// dialog of the wheel dialog module (docs/adr/0011), submitted at init
// with the startup priority, so it comes before any other dialog and the
// toasts wait for it. It opens 500 ms after its turn comes, drawn at once
// on all its layers, then faded in as a whole. While it is open it
// swallows every button through "commandbuttondown": Next / Prev move a
// gold halo through the choices, looping, with PinballY's navigation
// sound; Select runs the highlighted choice, Exit closes it; attract mode
// closes it too, and a game started during the pause drops it. Its layers
// are removed once it closes.
// ============================================================

import lang from "../common/i18n.js";
import { safeHandler } from "../common/safe_handler.js";
import { createPinballYHost } from "../common/pinbally_host.js";
import { getWheelDialogs, DIALOG_PRIORITY } from "../common/wheel_dialog.js";
import { getProfileStore } from "../common/profile_store.js";
import { displayNameOf } from "../common/profile_name.js";
import { getChangePlayer } from "../common/change_player.js";
import { getRandomGame } from "../common/random_game.js";
import { getTableOfTheDay, getTableOfTheWeek } from "../common/period_table.js";
import { masteryOf } from "../common/table_mastery.js";
import { masteryHeadOf } from "../common/mastery_bar.js";
import { createNavigationSound } from "../common/navigation_sound.js";
import { STEAMBALL_COLORS } from "../common/steamball_palette.js";
import {
    WELCOME_SCREEN_Z_INDEX, REFERENCE_HEIGHT, CHOICE, drawBackdrop, layoutWelcomeScreen,
} from "../common/welcome_screen_painter.js";

const SCRIPT_NAME = "WelcomeScreen";

// At startup the window is not laid out yet, and a window-sized canvas
// measured then comes out distorted (as for the Profile badge).
const STARTUP_PAUSE_MS = 500;
const FADE_MS = 220;
const FRAME_MS = 16;

// The greeting by the hour: from 5 h, 12 h, 18 h and 22 h.
function partOfDay(hour) {
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 18) return "afternoon";
    if (hour >= 18 && hour < 22) return "evening";
    return "night";
}

// Drops parenthetical suffixes, the replacement characters some PinballY
// databases carry in place of a lost "™" (raw, or read as Windows-1252),
// and the doubled spaces they leave.
function cleanTitle(title) {
    return title.replace(/\s*\([^)]*\)/g, "").replace(/ï¿½|�/g, "").replace(/\s{2,}/g, " ").trim();
}

export default function init() {
    const { welcomeScreen: TEXT } = lang;
    const host = createPinballYHost();
    const store = getProfileStore();
    const randomGame = getRandomGame();
    const periodTables = { [CHOICE.DAY]: getTableOfTheDay(), [CHOICE.WEEK]: getTableOfTheWeek() };
    const navigationSound = createNavigationSound(host, SCRIPT_NAME);
    const log = message => host.log(`[${SCRIPT_NAME}] ${message}`);

    // The wheel dialog module's close, from its turn until the screen closes.
    let closeDialog = null;
    let pauseTimer = null;
    // The pause ended away from the wheel: it starts again on the next return.
    let isWaitingForWheel = false;
    // The screen on show: its layers, choices and selection; null when closed.
    let shown = null;

    // The active Profile's most recent Play, across the whole collection.
    function lastPlayedTitle() {
        let last = null;
        for (const [configId, play] of Object.entries(store.getProfileData().plays)) {
            if (!play.lastPlayed || (last && play.lastPlayed <= last.lastPlayed)) continue;
            // A table removed from PinballY since is skipped.
            const game = host.getGameInfo(configId);
            if (game) last = { title: game.title, lastPlayed: play.lastPlayed };
        }
        return last ? cleanTitle(last.title) : null;
    }

    // The grey line: played this Period, or else a Streak of at least 2.
    function greyLineOf(periodTable, texts) {
        if (periodTable.isPlayedThisPeriod()) return { played: true, streak: 0, text: texts.played };
        const streak = periodTable.getStreak();
        return streak >= 2 ? { played: false, streak, text: texts.streak } : null;
    }

    // A card per Period Table offered to the active Profile; reading it
    // picks and locks this Period's table when nobody did yet.
    function readCards() {
        const cards = [];
        for (const choice of [CHOICE.DAY, CHOICE.WEEK]) {
            const periodTable = periodTables[choice];
            const game = periodTable.getOfferedTable();
            if (!game) continue;
            const texts = TEXT.periodCards[choice];
            const mastery = masteryOf(store.getPlay(game.configId));
            cards.push({
                choice,
                period: texts.period,
                title: cleanTitle(game.title),
                logoPath: host.getWheelImage(game),
                mastery,
                masteryHead: masteryHeadOf(mastery ? mastery.level : 0),
                line: greyLineOf(periodTable, texts),
                goLabel: TEXT.periodCards.go,
            });
        }
        return cards;
    }

    function readScreen() {
        const profile = store.getActiveProfile();
        const picker = getChangePlayer() !== null;
        const greeting = TEXT.greetings[partOfDay(host.now().getHours())];
        const stay = lastPlayedTitle();
        const cards = readCards();
        return {
            picker,
            avatarPath: profile.avatarPath,
            // Runs of [text, gold?]: only the name is gold.
            greeting: picker
                ? TEXT.greetingWithName(greeting, displayNameOf(profile)).map((part, index) => [part, index === 1])
                : [[TEXT.greetingAlone(greeting), false]],
            // The flippers' loop; the first one is selected on opening.
            cards,
            choices: [...(picker ? [CHOICE.AVATAR] : []), CHOICE.CLOSE, ...cards.map(card => card.choice), CHOICE.STAY, CHOICE.RANDOM],
            labels: {
                [CHOICE.AVATAR]: lang.profiles.menuEntry,
                [CHOICE.CLOSE]: TEXT.closeTooltip,
                [CHOICE.STAY]: stay ? TEXT.stayOn(stay) : TEXT.stayOnWheel,
                [CHOICE.RANDOM]: TEXT.randomTable,
            },
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

    // Draws every layer at once, hidden, then fades them in together:
    // drawn piece by piece through the drawing ahead, it stayed empty at
    // startup (docs/adr/0011).
    function draw() {
        const openedAt = host.now().getTime();
        const screen = readScreen();
        const layers = [];
        // The backdrop first: it measures the window and dims the wheel.
        const backdrop = hiddenLayer(WELCOME_SCREEN_Z_INDEX.backdrop);
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
        const { pieces, highlights } = layoutWelcomeScreen(host, screen, referenceWidth);
        pieces.forEach(drawPiece);
        const highlightLayers = screen.choices.map(choice => drawPiece(highlights[choice]));
        // Here rather than on the first move, which it would slow down.
        navigationSound.load();
        shown = { layers, highlightLayers, choices: screen.choices, selected: 0, opacity: 0, fadeTimer: null };
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

    function startPause() {
        isWaitingForWheel = false;
        pauseTimer = host.setTimeout(safeHandler(SCRIPT_NAME, () => {
            pauseTimer = null;
            // A menu or a game came up during the pause.
            if (host.getUIMode() === "wheel") draw();
            else isWaitingForWheel = true;
        }), STARTUP_PAUSE_MS);
    }

    // Its turn in the wheel dialog module: the wheel is free.
    function open(close) {
        closeDialog = close;
        startPause();
    }

    // Removes the screen, or drops it before it shows, and frees the queue.
    function close() {
        host.clearTimeout(pauseTimer);
        pauseTimer = null;
        isWaitingForWheel = false;
        if (shown) {
            stopFade(shown);
            for (const layer of shown.layers) host.removeDrawingLayer(layer);
            shown = null;
        }
        const done = closeDialog;
        closeDialog = null;
        if (done) done();
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
        close();
        if (choice === CHOICE.RANDOM) return randomGame.launch();
        if (choice === CHOICE.AVATAR) getChangePlayer()();
        // Locked when the screen was read; a new Period since may have
        // picked an Adult Table, never launched for a Child Profile.
        if (choice in periodTables) {
            if (periodTables[choice].isOffered()) periodTables[choice].launch();
            else log(`The ${choice} table is no longer offered to the active Profile.`);
        }
        // Close and Stay: closing is all they do.
        return undefined;
    }

    getWheelDialogs().submit({ priority: DIALOG_PRIORITY.STARTUP_PROMPT, open });

    // Fires on every mapped button press; drives the screen while it is
    // open. Async because the Random Game animates the wheel, so its
    // rejections are logged too.
    host.on("commandbuttondown", safeHandler(SCRIPT_NAME, async ev => {
        if (!shown) return;
        // Swallowed first, so a failing choice still never reaches the wheel.
        ev.preventDefault();
        if (ev.command === "Next" || ev.command === "Prev") move(ev.command === "Next" ? 1 : -1);
        else if (ev.command === "Select") await choose();
        else if (ev.command === "Exit") close();
    }));

    // Fires on every return to the wheel, after a menu or a game that came
    // up during the pause.
    host.on("wheelmode", safeHandler(SCRIPT_NAME, () => {
        if (isWaitingForWheel) startPause();
    }));

    // Fires when a table starts: one launched during the pause means the
    // player already chose, so the screen must not show after the game.
    host.on("gamestarted", safeHandler(SCRIPT_NAME, () => {
        if (closeDialog && !shown) close();
    }));

    // Fires when the cabinet sits idle: the screen must not stay over
    // attract mode nor keep the buttons.
    host.on("attractmodestart", safeHandler(SCRIPT_NAME, () => {
        if (closeDialog) close();
    }));
}
