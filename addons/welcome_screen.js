// ============================================================
// Welcome Screen: at startup (alone or after the startup Profile picker),
// after Change Player and from its main menu entry, a drawn panel greets the
// active Profile (Daily Streak, Lost Records, Collection Mastery) and offers
// a Period Table, a Random Game, or to stay. A drawn dialog of the wheel
// dialog module at the startup priority (docs/adr/0011).
// - At startup only, the startup veil dims the wheel until the panel is in.
// - Swallows every button through "commandbuttondown" while open.
// - Reading the Period cards picks and locks this Period's tables.
// - Writes the Lost Records seen marker to high_scores.json.
// - Holds the quiet wheel from its turn, pause included; gives it up at once to a launch, a menu or attract mode (docs/adr/0015).
// ============================================================

import lang from "../common/core/i18n.js";
import config from "../common/core/config.js";
import { safeHandler } from "../common/core/safe_handler.js";
import { createPinballYHost } from "../common/core/pinbally_host.js";
import { getWheelDialogs, DIALOG_PRIORITY } from "../common/core/wheel_dialog.js";
import { getStartupScreen, onStartupPickerDone, STARTUP_SCREEN } from "../common/core/startup_screen.js";
import { getMainMenu, MAIN_MENU_POSITION } from "../common/menus/main_menu.js";
import { getProfileStore } from "../common/profiles/profile_store.js";
import { getProfileRewards } from "../common/avatar_frames/profile_rewards.js";
import { getShownPlayerLevel } from "../common/levels/shown_player_level.js";
import { displayNameOf } from "../common/profiles/profile_name.js";
import { cleanTitle } from "../common/tables/table_title.js";
import { getChangePlayer } from "../common/profiles/change_player.js";
import { getRandomGame } from "../common/tables/random_game.js";
import { getDailyStreak } from "../common/achievements/daily_streak.js";
import { getHighScoreStore } from "../common/high_scores/high_score_store.js";
import { getTableOfTheDay, getTableOfTheWeek } from "../common/tables/period_table.js";
import { masteryOf, collectionMasteryOfProfile } from "../common/mastery/table_mastery.js";
import { tablesVisibleTo } from "../common/tables/visible_tables.js";
import { masteryHeadOf, collectionTextsOf } from "../common/mastery/mastery_bar.js";
import { createNavigationSound } from "../common/core/navigation_sound.js";
import { STEAMBALL_COLORS } from "../common/drawing/steamball_palette.js";
import { createSelectionMarker } from "../common/drawing/selection_marker.js";
import { getStartupVeil } from "../common/drawing/startup_veil.js";
import { getQuietWheel } from "../common/core/quiet_wheel.js";
import { EXIT_BUTTON_LOOK } from "../common/drawing/steamball_drawing.js";
import { buttonHintGroupsOf, exitButtonWordOf, FLIPPER_HINT } from "../common/drawing/button_hints.js";
import {
    WELCOME_SCREEN_Z_INDEX, REFERENCE_HEIGHT, CHOICE, AVATAR_FRAME_WIDTH, drawBackdrop, layoutWelcomeScreen,
} from "../common/welcome_screen/welcome_screen_painter.js";

const SCRIPT_NAME = "WelcomeScreen";

// At startup the window is not laid out yet, and a window-sized canvas
// measured then comes out distorted (as for the Profile badge).
const STARTUP_PAUSE_MS = 500;
const FADE_MS = 220;
const FRAME_MS = 16;
// The Lost Records line names this many tables at most, then counts the others.
const MAX_NAMED_LOST_RECORDS = 3;
// Exit always leaves the bare wheel.
const EXIT_LOOK = EXIT_BUTTON_LOOK.CLOSE;

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
    // The Lost Records come from the High Scores Add-on's store: none when it is off.
    const highScores = config.addOns.highScores === false ? null : getHighScoreStore();
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
    // Highlighted on opening: Close once the player was just changed or picked.
    let firstChoice = null;
    const startupVeil = getStartupVeil();
    const quietWheel = getQuietWheel();

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

    // Each missing Avatar logged once: the screen opens on every change of player.
    const loggedMissingAvatars = new Set();
    // The taker's Avatar on the Lost Records line; null, logged, when its
    // image cannot be read, so the line shows its text alone.
    function lineAvatarOf(taker) {
        if (host.files.isImageReadable(taker.avatarPath)) return taker.avatarPath;
        if (!loggedMissingAvatars.has(taker.avatarPath)) {
            loggedMissingAvatars.add(taker.avatarPath);
            log(`${taker.avatarPath} is missing or unreadable; the Lost Records line shows without ${taker.name}'s Avatar.`);
        }
        return null;
    }

    // The Lost Records on the tables the active Profile can see: the one
    // alone, or the most recent few named and the others counted, behind
    // the most recent taker's Avatar.
    function readLostRecordsLine(profile) {
        if (!highScores) return null;
        const visibleTables = tablesVisibleTo(host.getVisibleTables(), store);
        const lostRecords = highScores.lostRecordsOf(profile.name, visibleTables.map(game => game.configId));
        if (lostRecords.length === 0) return null;
        const named = lostRecords.slice(0, MAX_NAMED_LOST_RECORDS).map(lost => ({
            taker: displayNameOf(lost.taker),
            tableTitle: cleanTitle(visibleTables.find(candidate => candidate.configId === lost.configId).title),
        }));
        const text = named.length === 1
            ? TEXT.lostRecord(named[0].taker, named[0].tableTitle)
            : TEXT.lostRecords(named, lostRecords.length - named.length);
        return { avatarPath: lineAvatarOf(lostRecords[0].taker), text };
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

    function readScreen(profile) {
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
            lostRecords: readLostRecordsLine(profile),
            collection: readCollection(),
            cards,
            // The flippers' loop; the first one is selected on opening,
            // unless firstChoice is one of them.
            choices: [...(picker ? [CHOICE.AVATAR] : []), CHOICE.EXIT_BUTTON, ...cards.map(card => card.choice), CHOICE.RANDOM, CHOICE.STAY],
            labels: {
                [CHOICE.AVATAR]: lang.profiles.menuEntry,
                [CHOICE.EXIT_BUTTON]: exitButtonWordOf(EXIT_LOOK),
                [CHOICE.STAY]: stay ? TEXT.stayOn(stay) : TEXT.stayOnWheel,
                [CHOICE.RANDOM]: TEXT.randomTable,
            },
            exitLook: EXIT_LOOK,
            buttonHints: buttonHintGroupsOf({ flippers: FLIPPER_HINT.BROWSE, select: true, exitLook: EXIT_LOOK }),
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
        // Again: a launch or a menu during the pause may have released it.
        quietWheel.hold(SCRIPT_NAME);
        const profile = store.getActiveProfile();
        const screen = readScreen(profile);
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
        // Only the Avatar and the Exit Button have a tooltip: null for the others.
        const tooltipLayers = screen.choices.map(choice => (highlights[choice].tooltip ? drawPiece(highlights[choice].tooltip) : null));
        // Seen once drawn, even if the screen closes at once.
        if (highScores) highScores.markLostRecordsSeen(profile.name);
        // Here rather than on the first move, which it would slow down.
        navigationSound.load();
        const selected = Math.max(0, screen.choices.indexOf(firstChoice));
        const targets = screen.choices.map(choice => highlights[choice].target);
        const marker = createSelectionMarker(host, { zIndex: WELCOME_SCREEN_Z_INDEX.marker, referenceWidth, referenceHeight: REFERENCE_HEIGHT });
        marker.moveTo(targets[selected]);
        shown = { layers, tooltipLayers, marker, targets, choices: screen.choices, selected, opacity: 0, fadeTimer: null };
        // The comet would freeze while the screen is drawn on the UI thread:
        // it goes as the panel fades in, the veil once the panel is fully in.
        startupVeil.hideLoader();
        fadeIn(shown);
        playGreetingSound();
        log(`Opened, drawn in ${host.now().getTime() - openedAt} ms.`);
    }

    // The marker and every layer to the same opacity, except the unselected
    // choices' tooltips, kept hidden.
    function setOpacity(screen, opacity) {
        screen.opacity = opacity;
        const unselected = screen.tooltipLayers.filter((layer, index) => layer && index !== screen.selected);
        for (const layer of screen.layers) layer.alpha = unselected.includes(layer) ? 0 : opacity;
        screen.marker.setOpacity(opacity);
    }

    function fadeIn(screen) {
        const startMs = host.now().getTime();
        // Timed on the clock: Windows timers fire late.
        screen.fadeTimer = host.setInterval(safeHandler(SCRIPT_NAME, () => {
            const opacity = Math.min(1, (host.now().getTime() - startMs) / FADE_MS);
            setOpacity(screen, opacity);
            if (opacity >= 1) {
                stopFade(screen);
                startupVeil.hideVeil();
            }
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
            else {
                isWaitingForWheel = true;
                startupVeil.hide();
                quietWheel.release(SCRIPT_NAME, { atOnce: true });
            }
        }), STARTUP_PAUSE_MS);
    }

    // Its turn in the wheel dialog module: the wheel is free.
    // Held from here, not from the drawing: the Profile picker's hand-over
    // is shorter than the pause.
    function open(close) {
        isSubmitted = false;
        closeDialog = close;
        quietWheel.hold(SCRIPT_NAME);
        startPause();
    }

    // Removes the screen, or drops it before it shows, and frees the queue.
    // atOnce: nothing follows (a table chosen, attract mode), back at its own
    // volume before the wheel moves.
    function close({ atOnce = false } = {}) {
        host.clearTimeout(pauseTimer);
        pauseTimer = null;
        isWaitingForWheel = false;
        startupVeil.hide();
        if (shown) {
            stopFade(shown);
            shown.marker.remove();
            for (const layer of shown.layers) host.removeDrawingLayer(layer);
            shown = null;
        }
        quietWheel.release(SCRIPT_NAME, { atOnce });
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
        shown.marker.moveTo(shown.targets[shown.selected]);
    }

    function choose() {
        const choice = shown.choices[shown.selected];
        close({ atOnce: choice === CHOICE.RANDOM || choice in periodTables });
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

    const startupScreen = getStartupScreen();
    if (startupScreen === STARTUP_SCREEN.WELCOME) {
        submit(null);
        startupVeil.show();
    }
    // The startup Profile picker hands over on a pick or Exit, before any
    // switch, so the switch below adds no second screen. The player was
    // just chosen: the cursor on the cross, as after Change Player.
    if (startupScreen === STARTUP_SCREEN.PROFILE_PICKER) {
        onStartupPickerDone(safeHandler(SCRIPT_NAME, () => {
            if (!isSubmitted && !closeDialog) submit(CHOICE.EXIT_BUTTON);
        }));
    }

    // Read again when the screen opens, the cursor on the cross; nothing
    // more while the screen is still waiting or open.
    function reopenWelcomeScreen() {
        if (!isSubmitted && !closeDialog) submit(CHOICE.EXIT_BUTTON);
    }

    // Through the wheel dialog module rather than opened directly, so that
    // toasts and other dialogs wait for it.
    getMainMenu().add({ name: "welcomeScreen", label: TEXT.menuEntry, position: MAIN_MENU_POSITION.WELCOME_SCREEN, action: reopenWelcomeScreen });

    // Fires on every switch, which the Profile picker makes only to another
    // Profile: the new player is welcomed too.
    store.onSwitch(safeHandler(SCRIPT_NAME, reopenWelcomeScreen));

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
        if (closeDialog && !shown) close({ atOnce: true });
    }));

    // Fires when the cabinet sits idle: the screen must not stay over
    // attract mode nor keep the buttons.
    host.on("attractmodestart", safeHandler(SCRIPT_NAME, () => {
        if (closeDialog) close({ atOnce: true });
    }));

    // Fire when a table starts launching or a menu opens during the pause:
    // the table must not stay lowered under them. The screen holds the
    // wheel again if it still shows afterwards.
    const giveWayInPause = safeHandler(SCRIPT_NAME, () => {
        if (closeDialog && !shown) quietWheel.release(SCRIPT_NAME, { atOnce: true });
    });
    host.on("launchoverlayshow", giveWayInPause);
    host.on("menuopen", giveWayInPause);
}
