// ============================================================
// Welcome Screen: at startup, and again whenever Change Player switches
// to another Profile, a centred Steamball panel drawn over the
// dimmed wheel greets the active Profile by the hour (its Avatar, in its
// worn Avatar Frame, with the shown Player Level as a pip, and its name
// in gold when the Profile picker is on), shows its Daily Streak under the greeting from 2 days
// on, then its Lost Records (with the High Scores Add-on on: the Table
// Records other Profiles took from it since its last Welcome Screen, the
// three most recent named in one line and the others counted, seen
// once the screen is drawn, the seen marker written to high_scores.json),
// its Collection Mastery (the tier kept in profile.json when the
// tables no longer reach it) and offers to close, to play the Table of the Day or of the Week
// (one card each, with its Table Mastery and the active Profile's Streak;
// reading them picks and locks this Period's tables, and Select launches
// one, selected on the wheel first), to launch a Random Game or to stay on the table selected on the wheel. It
// is a drawn dialog of the wheel dialog module (docs/adr/0011), submitted
// at init with the startup priority, so it comes before any other dialog and the
// toasts wait for it. It opens 500 ms after its turn comes, drawn at once
// on all its layers, then faded in as a whole with the Profile Greeting's
// sound, since it greets the Profile in its place. At startup only, from
// init, a veil dims the wheel with the Loader turning over it, just under
// the panel: the Loader goes as the panel fades in, the veil once it is
// fully in; both go at once when a menu, a launch or attract mode comes up
// first. While it is open it
// swallows every button through "commandbuttondown": Next / Prev move the
// Selection Marker (a gold glow flowing round the choice) through the
// choices, looping, with PinballY's navigation sound, from Change Player
// at startup and from Close after a change of player; Select or Launch
// (the plunger) runs the selected choice, Exit
// closes it; attract mode closes it too, and a game started during the
// pause drops it. A footer of Button Hints names the flippers, Select and
// Exit. Its layers and the marker are removed once it closes.
// ============================================================

import lang from "../common/core/i18n.js";
import config from "../common/core/config.js";
import { safeHandler } from "../common/core/safe_handler.js";
import { createPinballYHost } from "../common/core/pinbally_host.js";
import { getWheelDialogs, DIALOG_PRIORITY } from "../common/core/wheel_dialog.js";
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
import { createLoader } from "../common/drawing/loader.js";
import { DIMMED_WHEEL, EXIT_BUTTON_LOOK } from "../common/drawing/steamball_drawing.js";
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
// Just under the panel's backdrop: the startup veil dims the wheel as the
// backdrop will, the Loader turns over it.
const STARTUP_VEIL_Z_INDEX = WELCOME_SCREEN_Z_INDEX.backdrop - 2;
const STARTUP_LOADER_Z_INDEX = WELCOME_SCREEN_Z_INDEX.backdrop - 1;
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
    // Highlighted on opening: Close once the player was just changed.
    let firstChoice = null;
    const startupLoader = createLoader(host, { zIndex: STARTUP_LOADER_Z_INDEX });
    // The startup veil's layer, null once it is gone.
    let startupVeil = null;

    // From the first frame the pack can show, while the startup screen is
    // prepared: cleared, not drawn, so nothing measures the window, which
    // is not laid out yet.
    function showStartupVeilAndLoader() {
        startupVeil = host.createDrawingLayer(STARTUP_VEIL_Z_INDEX);
        startupVeil.clear(DIMMED_WHEEL);
        startupLoader.show();
    }

    function hideStartupVeil() {
        if (!startupVeil) return;
        host.removeDrawingLayer(startupVeil);
        startupVeil = null;
    }

    // Safe to call again, and once both are already gone.
    function hideStartupVeilAndLoader() {
        startupLoader.hide();
        hideStartupVeil();
    }

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
        startupLoader.hide();
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
                hideStartupVeil();
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
                hideStartupVeilAndLoader();
            }
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
        hideStartupVeilAndLoader();
        if (shown) {
            stopFade(shown);
            shown.marker.remove();
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
        shown.marker.moveTo(shown.targets[shown.selected]);
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
    showStartupVeilAndLoader();

    // Fires on every switch, which the Profile picker makes only to another
    // Profile: the new player is welcomed too, read again when the screen
    // opens. Once only when the screen is still waiting or open.
    store.onSwitch(safeHandler(SCRIPT_NAME, () => {
        if (!isSubmitted && !closeDialog) submit(CHOICE.EXIT_BUTTON);
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

    // Fire when a menu opens or a table starts launching (whose overlay has
    // its own Loader): the startup veil and Loader must not sit over them.
    host.on("menuopen", safeHandler(SCRIPT_NAME, hideStartupVeilAndLoader));
    host.on("launchoverlayshow", safeHandler(SCRIPT_NAME, hideStartupVeilAndLoader));

    // Fires when the cabinet sits idle: the screen must not stay over
    // attract mode nor keep the buttons.
    host.on("attractmodestart", safeHandler(SCRIPT_NAME, () => {
        hideStartupVeilAndLoader();
        if (closeDialog) close();
    }));
}
