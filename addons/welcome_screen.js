// ============================================================
// Welcome Screen: at startup, and again whenever Change Player switches
// to another Profile, a centred Steamball panel drawn over the
// dimmed wheel greets the active Profile by the hour (its Avatar, in its
// worn Avatar Frame, with the shown Player Level as a pip, and its name
// in gold when the Profile picker is on), shows its Daily Streak under the greeting from 2 days
// on, its Collection Mastery (the tier kept in profile.json when the
// tables no longer reach it) and offers to close, to play the Table of the Day or of the Week
// (one card each, with its Table Mastery and the active Profile's Streak;
// reading them picks and locks this Period's tables, and Select launches
// one, selected on the wheel first), to stay on the table selected on the wheel or to launch a Random Game. It
// is a drawn dialog of the wheel dialog module (docs/adr/0011), submitted
// at init with the startup priority, so it comes before any other dialog and the
// toasts wait for it. It opens 500 ms after its turn comes, drawn at once
// on all its layers, then faded in as a whole with the Profile Greeting's
// sound, since it greets the Profile in its place. While it is open it
// swallows every button through "commandbuttondown": Next / Prev move a
// gold halo through the choices, looping, with PinballY's navigation
// sound, from Change Player at startup and from Close after a change of
// player; Select or Launch (the plunger) runs the highlighted choice, Exit
// closes it; attract mode closes it too, and a game started during the
// pause drops it. Its layers are removed once it closes.
// ============================================================

import lang from "../common/i18n.js";
import config from "../common/config.js";
import { safeHandler } from "../common/safe_handler.js";
import { createPinballYHost } from "../common/pinbally_host.js";
import { getWheelDialogs, DIALOG_PRIORITY } from "../common/wheel_dialog.js";
import { getProfileStore } from "../common/profile_store.js";
import { getProfileRewards } from "../common/profile_rewards.js";
import { getShownPlayerLevel } from "../common/shown_player_level.js";
import { displayNameOf } from "../common/profile_name.js";
import { cleanTitle } from "../common/table_title.js";
import { getChangePlayer } from "../common/change_player.js";
import { getRandomGame } from "../common/random_game.js";
import { getDailyStreak } from "../common/daily_streak.js";
import { getTableOfTheDay, getTableOfTheWeek } from "../common/period_table.js";
import { masteryOf, collectionMasteryOfProfile } from "../common/table_mastery.js";
import { tablesVisibleTo } from "../common/visible_tables.js";
import { masteryHeadOf, collectionTextsOf } from "../common/mastery_bar.js";
import { createNavigationSound } from "../common/navigation_sound.js";
import { STEAMBALL_COLORS } from "../common/steamball_palette.js";
import {
    WELCOME_SCREEN_Z_INDEX, REFERENCE_HEIGHT, CHOICE, AVATAR_FRAME_WIDTH, drawBackdrop, layoutWelcomeScreen,
} from "../common/welcome_screen_painter.js";

const SCRIPT_NAME = "WelcomeScreen";

// At startup the window is not laid out yet, and a window-sized canvas
// measured then comes out distorted (as for the Profile badge).
const STARTUP_PAUSE_MS = 500;
const FADE_MS = 220;
const FRAME_MS = 16;

// The greeting by the hour: from 5 h, 12 h, 19 h and 22 h.
function partOfDay(hour) {
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 19) return "afternoon";
    if (hour >= 19 && hour < 22) return "evening";
    return "night";
}

export default function init() {
    const { welcomeScreen: TEXT } = lang;
    const host = createPinballYHost();
    const store = getProfileStore();
    const shownPlayerLevel = getShownPlayerLevel();
    const randomGame = getRandomGame();
    const dailyStreak = getDailyStreak();
    const periodTables = { [CHOICE.DAY]: getTableOfTheDay(), [CHOICE.WEEK]: getTableOfTheWeek() };
    const navigationSound = createNavigationSound(host, SCRIPT_NAME);
    // The screen greets the Profile in place of the Profile Greeting, so it
    // takes its sound; one that cannot play is logged and never stops the screen.
    const playGreetingSound = safeHandler(SCRIPT_NAME, () => {
        if (config.profileGreetingSoundFile) host.playSound(config.profileGreetingSoundFile);
    });
    const log = message => host.log(`[${SCRIPT_NAME}] ${message}`);

    // Queued, waiting its turn in the wheel dialog module.
    let isSubmitted = false;
    // The wheel dialog module's close, from its turn until the screen closes.
    let closeDialog = null;
    let pauseTimer = null;
    // The pause ended away from the wheel: it starts again on the next return.
    let isWaitingForWheel = false;
    // The screen on show: its layers, choices and selection; null when closed.
    let shown = null;
    // Highlighted on opening: Close once the player was just changed.
    let firstChoice = null;

    // The grey line: played this Period, or else a Streak of at least 2.
    function greyLineOf(periodTable, texts) {
        if (periodTable.isPlayedThisPeriod()) return { played: true, streak: 0, text: texts.played };
        const streak = periodTable.getStreak();
        return streak >= 2 ? { played: false, streak, text: texts.streak } : null;
    }

    // The Daily Streak line: from 2 days on, asking to keep it going while
    // today has no Play yet.
    function readDailyStreakLine() {
        const { current, isTodayCounted } = dailyStreak.read();
        if (current < 2) return null;
        return { count: current, text: isTodayCounted ? TEXT.cabinetStreak.playedToday : TEXT.cabinetStreak.notYetToday };
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

    // Over the tables the active Profile can see; a tier it reached stays.
    const readCollection = () => collectionTextsOf(
        collectionMasteryOfProfile(tablesVisibleTo(host.getVisibleTables(), store), store.getProfileData()));

    function readScreen() {
        const profile = store.getActiveProfile();
        const picker = getChangePlayer() !== null;
        const greeting = TEXT.greetings[partOfDay(host.now().getHours())];
        // What the wheel shows behind the screen: staying keeps it.
        const current = host.getCurrentTable();
        const stay = current ? cleanTitle(current.title) : null;
        const cards = readCards();
        return {
            picker,
            avatarPath: profile.avatarPath,
            framePath: picker ? getProfileRewards().wornImageOf(profile.name, AVATAR_FRAME_WIDTH) : null,
            level: shownPlayerLevel.get(),
            // Runs of [text, gold?]: only the name is gold.
            greeting: picker
                ? TEXT.greetingWithName(greeting, displayNameOf(profile)).map((part, index) => [part, index === 1])
                : [[TEXT.greetingAlone(greeting), false]],
            dailyStreak: readDailyStreakLine(),
            collection: readCollection(),
            cards,
            // The flippers' loop; the first one is selected on opening,
            // unless firstChoice is one of them.
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
        const selected = Math.max(0, screen.choices.indexOf(firstChoice));
        shown = { layers, highlightLayers, choices: screen.choices, selected, opacity: 0, fadeTimer: null };
        fadeIn(shown);
        playGreetingSound();
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
        isSubmitted = false;
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

    function submit(choice) {
        isSubmitted = true;
        firstChoice = choice;
        getWheelDialogs().submit({ priority: DIALOG_PRIORITY.STARTUP_PROMPT, open });
    }

    submit(null);

    // Fires on every switch, which the Profile picker makes only to another
    // Profile: the new player is welcomed too, read again when the screen
    // opens. Once only when the screen is still waiting or open.
    store.onSwitch(safeHandler(SCRIPT_NAME, () => {
        if (!isSubmitted && !closeDialog) submit(CHOICE.CLOSE);
    }));

    // Fires on every mapped button press; drives the screen while it is
    // open. Async because the Random Game animates the wheel, so its
    // rejections are logged too.
    host.on("commandbuttondown", safeHandler(SCRIPT_NAME, async ev => {
        if (!shown) return;
        // Swallowed first, so a failing choice still never reaches the wheel.
        ev.preventDefault();
        if (ev.command === "Next" || ev.command === "Prev") move(ev.command === "Next" ? 1 : -1);
        // Launch is the plunger, which selects in PinballY's own menus too.
        else if (ev.command === "Select" || ev.command === "Launch") await choose();
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
