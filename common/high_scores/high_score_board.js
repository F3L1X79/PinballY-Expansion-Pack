// ============================================================
// High Score Board module: the drawn screen the player opens from the main
// menu or the HighScores button to see the selected table's board, as the
// High Score store knows it: the table's title, the podium for the three
// first places and compact rows for the others, laid out by the High Score
// Board painter on the Drawn Menu's panel, a Gold, Silver and Bronze crown
// over the podium's three steps. Each place shows its owner's name and
// Avatar, in the Avatar Frame its Profile wears, or "Default score" with
// the Default Score image of its initials, read again on every opening.
// Opens at once on the last known board under a "Reading..." note (or a
// "Reading..." message for a table never read) while the High Scores
// Add-on reads it fresh, then redraws in place: the fresh board, "No score
// yet" when empty, a "could not be refreshed" note when the read failed,
// "not supported" when PINemHi says so or no board is known, or "Play a
// game to bring up this table's high scores" for a table without a ROM
// whose VPReg.stg section or text file is not learned yet. The Loader
// turns above the board, on its top third, while the fresh read runs,
// from the end of the board's fade in. The screen
// is drawn at once on all its layers, then faded in; the crowns, drawn
// ahead once on their own layers through the shared drawing ahead
// (PinballY reads an image file again on every draw), are only placed,
// and wait hidden, shrunk to a point, while the board is closed. The Exit
// Button is its only choice. While
// open it swallows every button through "commandbuttondown"; when the
// rows below the podium do not all fit the window, the flippers (Next /
// Prev) scroll them, the podium staying in place; Exit closes it and calls
// the return given to open(); attract mode only closes it. Opens directly,
// not through the wheel dialog module: the player asked for it. isOpen() and
// onClosed() let the wheel dialogs wait for it.
// ============================================================

import lang from "../core/i18n.js";
import { displayNameOf } from "../profiles/profile_name.js";
import { safeHandler } from "../core/safe_handler.js";
import { createClosedListeners } from "../core/closed_listeners.js";
import { openDrawnScreen } from "../stats/drawn_screen.js";
import { createLoader, LOADER_PLACEMENT } from "../drawing/loader.js";
import { createSelectionMarker } from "../drawing/selection_marker.js";
import { drawExitButton } from "../drawing/steamball_drawing.js";
import { exitButtonLookOf, exitButtonWordOf, buttonHintGroupsOf, FLIPPER_HINT } from "../drawing/button_hints.js";
import { SCRIPT_NAME } from "./high_score_store.js";
import { readDefaultScoreImages, pickDefaultScoreImages } from "./default_score_images.js";
import {
    HIGH_SCORE_BOARD_Z_INDEX as Z_INDEX, HIGH_SCORE_BOARD_CROWN_Z_INDEX, HIGH_SCORE_BOARD_LOADER_Z_INDEX, CROWN_IMAGES, CROWN_CANVAS, REFERENCE_HEIGHT, PODIUM_PLACES, AVATAR_FRAME_WIDTH, CANVAS_ZOOM,
    layoutHighScoreBoard, placedRect, drawBackdrop, drawPanel, drawGlass, drawCrown, drawTitle, drawNote, drawMessage, drawStep, drawRow, drawExitTooltip, drawButtonHints,
} from "./high_score_board_painter.js";

const TRANSPARENT = 0x00000000;
// A hidden layer shrunk to a point: PinballY would otherwise fill every
// pixel of the window with it at each frame, even invisible.
const POINT_SCALE = Object.freeze({ xSpan: 0.001, ySpan: 0.001 });

// highScores: the High Score store; profileRewards: the worn Avatar
// Frames; drawingAhead: the shared drawing ahead
// (common/core/drawing_ahead.js); refresh(configId): reads the table's board into the store,
// resolving to "read", "unsupported", "failed" or "notLearned" (a table
// without a ROM whose board source is not learned yet).
export function createHighScoreBoard(host, { highScores, profileRewards, drawingAhead, refresh }) {
    const log = message => host.log(`[${SCRIPT_NAME}] ${message}`);
    const closedListeners = createClosedListeners(SCRIPT_NAME);
    const projectFolder = host.getProjectFolder();
    // On the top third, so that the comet never hides the scores.
    const loader = createLoader(host, { zIndex: HIGH_SCORE_BOARD_LOADER_Z_INDEX, placement: LOADER_PLACEMENT.TOP_THIRD });

    function hideCrown(crown) {
        crown.layer.alpha = 0;
        crown.layer.setScale(POINT_SCALE);
    }
    // The 1st, 2nd and 3rd places' crowns, each on its own layer, drawn once.
    const crowns = CROWN_IMAGES.map((_, index) => ({ index, layer: host.createDrawingLayer(HIGH_SCORE_BOARD_CROWN_Z_INDEX), isDrawn: false }));
    crowns.forEach(hideCrown);

    function drawCrownLayer(crown) {
        crown.layer.clear(TRANSPARENT);
        crown.layer.draw(dc => drawCrown(dc, projectFolder, crown.index), CROWN_CANVAS, CROWN_CANVAS);
        crown.isDrawn = true;
    }

    // One crown per step of the drawing ahead.
    drawingAhead.add(() => {
        const crown = crowns.find(candidate => !candidate.isDrawn);
        if (!crown) return false;
        drawCrownLayer(crown);
        return true;
    });
    // The screen on show: its drawn screen, return, opacity, the layers
    // of its content (all but the backdrop), its layout, its rows' layers
    // and the first row in view; null when closed.
    let shown = null;

    // Each line once: the Default Score images are read again on every opening.
    const loggedImageLines = new Set();
    function logImageLine(line) {
        if (loggedImageLines.has(line)) return;
        loggedImageLines.add(line);
        log(line);
    }

    // The owner's Avatar; null, logged, when its image is missing.
    function avatarOf(owner) {
        if (host.files.isImageReadable(owner.avatarPath)) return owner.avatarPath;
        log(`${owner.avatarPath} is missing or unreadable; ${owner.name}'s places show without an Avatar.`);
        return null;
    }

    // defaultImageOf(initials): a Default Score's image.
    function placeShown({ rank, initials, score, owner }, defaultImageOf) {
        const TEXT = lang.highScores.board;
        return {
            rank,
            name: owner ? displayNameOf(owner) : TEXT.defaultScore,
            isDefaultScore: owner === null,
            avatarPath: owner ? avatarOf(owner) : defaultImageOf(initials),
            framePath: owner ? profileRewards.wornImageOf(owner.name, AVATAR_FRAME_WIDTH) : null,
            initials: initials || TEXT.noInitials,
            score: lang.profileStats.number(score),
            isTableRecord: rank === 1,
        };
    }

    // What the screen shows of the table: its title, its last known
    // places, and the message or note for where the read stands (status:
    // "reading", "read", "unsupported", "failed", "notLearned"); defaultImages: the
    // Default Score images' paths.
    function screenFor(game, status, defaultImages) {
        const TEXT = lang.highScores.board;
        const known = game ? highScores.boardOf(game.configId) : [];
        const screen = { title: game ? game.title : "", places: [], message: null, note: null };
        if (status === "notLearned") screen.message = TEXT.notLearned;
        else if (status === "unsupported" || (known === null && status === "failed")) screen.message = TEXT.notSupported;
        else if (known === null) screen.message = TEXT.reading;
        else if (known.length === 0) {
            screen.message = status === "reading" ? TEXT.reading : TEXT.noScore;
            if (status === "failed") screen.note = TEXT.notRefreshed;
        } else {
            const defaultImageOf = pickDefaultScoreImages(known.filter(place => place.owner === null).map(place => place.initials), defaultImages);
            screen.places = known.map(place => placeShown(place, defaultImageOf));
            if (status === "reading") screen.note = TEXT.reading;
            if (status === "failed") screen.note = TEXT.notRefreshed;
        }
        return screen;
    }

    // Sets every content layer's alpha to the screen's opacity, the rows
    // out of view hidden, and puts each row in its scrolled place.
    function showContent(opened) {
        const { drawn, geometry, rowLayers, firstRow } = opened;
        for (const layer of [...opened.content, ...opened.crownLayers]) layer.alpha = opened.opacity;
        opened.marker.setOpacity(opened.opacity);
        rowLayers.forEach((layer, index) => {
            drawn.place(layer, placedRect(geometry, geometry.rows[index], firstRow * geometry.rowPitch));
            const inView = index >= firstRow && index < firstRow + geometry.rowsInView;
            layer.alpha = inView ? opened.opacity : 0;
        });
    }

    // Draws the panel and everything on it into opened.content, at the
    // screen's current opacity; the backdrop stays. The first row in view
    // stays where it was, as far as the new rows allow.
    function drawContent(opened, screen) {
        const TEXT = lang.highScores.board;
        const { drawn } = opened;
        const geometry = layoutHighScoreBoard(drawn.referenceWidth, screen.places.length);
        const content = [];
        const piece = (zIndex, rect, draw) => drawn.drawPiece(zIndex, placedRect(geometry, rect), draw, content, rect);
        // Drawn finer, on a canvas CANVAS_ZOOM times the rect.
        const finePiece = (zIndex, rect, draw) => drawn.drawPiece(zIndex, placedRect(geometry, rect), draw, content, { w: rect.w * CANVAS_ZOOM, h: rect.h * CANVAS_ZOOM });
        const { panel } = geometry;
        piece(Z_INDEX.panel, panel, dc => drawPanel(dc, projectFolder, panel.w, panel.h));
        piece(Z_INDEX.title, geometry.title, dc => drawTitle(host, dc, screen.title, geometry.title.w, geometry.title.h));
        if (screen.note !== null) piece(Z_INDEX.note, geometry.note, dc => drawNote(host, dc, screen.note, geometry.note.w, geometry.note.h));
        if (screen.message !== null) {
            piece(Z_INDEX.message, geometry.message, dc => drawMessage(host, dc, screen.message, geometry.message.w, geometry.message.h));
        }
        screen.places.slice(0, PODIUM_PLACES).forEach((place, index) => {
            const rect = geometry.steps[index];
            piece(Z_INDEX.podium, rect, dc => drawStep(host, dc, place, index, TEXT.record, rect.w));
        });
        crowns.forEach(hideCrown);
        // Drawn now when the board opens before the drawing ahead reached them.
        const crownLayers = crowns.slice(0, Math.min(PODIUM_PLACES, screen.places.length)).map((crown, index) => {
            if (!crown.isDrawn) drawCrownLayer(crown);
            const { framed, bare } = geometry.crowns[index];
            drawn.place(crown.layer, placedRect(geometry, screen.places[index].framePath ? framed : bare));
            return crown.layer;
        });
        const rowLayers = screen.places.slice(PODIUM_PLACES).map((place, index) => {
            const rect = geometry.rows[index];
            return piece(Z_INDEX.rows, rect, dc => drawRow(host, dc, place, rect.w));
        });
        piece(Z_INDEX.glass, panel, dc => drawGlass(dc, projectFolder, panel.w, panel.h));
        const { exitLook } = opened;
        const flippers = geometry.rows.length > geometry.rowsInView ? FLIPPER_HINT.SCROLL : null;
        const hints = buttonHintGroupsOf({ flippers, exitLook });
        finePiece(Z_INDEX.buttonHints, geometry.buttonHints, dc => drawButtonHints(host, dc, hints, geometry.buttonHints.w, geometry.buttonHints.h));
        // At its default size: the board's Exit Button, CANVAS_ZOOM times.
        finePiece(Z_INDEX.exitButton, geometry.exitButton, dc => drawExitButton(dc, exitLook));
        finePiece(Z_INDEX.tooltip, geometry.exitTooltip, dc => drawExitTooltip(host, dc, exitButtonWordOf(exitLook)));
        // The panel's height follows the board: the Exit Button may have moved.
        opened.marker.moveTo(placedRect(geometry, geometry.exitButton));
        opened.content = content;
        opened.geometry = geometry;
        opened.rowLayers = rowLayers;
        opened.crownLayers = crownLayers;
        opened.firstRow = Math.min(opened.firstRow, lastFirstRow(opened));
        showContent(opened);
    }

    // The first row in view once scrolled to the last place.
    const lastFirstRow = ({ geometry }) => Math.max(0, geometry.rows.length - geometry.rowsInView);

    // direction: 1 for Next, -1 for Prev; one row at a time, stopping at
    // either end. Does nothing when every row is in view.
    function scroll(direction) {
        const firstRow = Math.max(0, Math.min(lastFirstRow(shown), shown.firstRow + direction));
        if (firstRow === shown.firstRow) return;
        shown.firstRow = firstRow;
        showContent(shown);
    }

    // onBack: what Exit returns to (a screen or a menu), called once the
    // screen is closed; none when Exit leaves the bare wheel.
    // Opens at once on the last known board and redraws in place when the
    // fresh read ends; a read ending after close only updated the store.
    function open(onBack = null) {
        if (shown) return;
        const openedAt = host.now().getTime();
        const game = host.getCurrentTable();
        const drawn = openDrawnScreen(host, SCRIPT_NAME, {
            referenceHeight: REFERENCE_HEIGHT,
            backdropZIndex: Z_INDEX.backdrop,
            drawBackdrop,
        });
        const marker = createSelectionMarker(host, { zIndex: Z_INDEX.marker, referenceWidth: drawn.referenceWidth, referenceHeight: REFERENCE_HEIGHT });
        const opened = {
            drawn, onBack, exitLook: exitButtonLookOf(onBack !== null), marker,
            opacity: 0, content: [], geometry: null, rowLayers: [], crownLayers: [], firstRow: 0, isReading: Boolean(game),
        };
        shown = opened;
        const defaultImages = readDefaultScoreImages(host, logImageLine);
        drawContent(opened, screenFor(game, game ? "reading" : "read", defaultImages));
        // The Loader waits for the end of the fade in: at full opacity over a
        // board still fading, it would stand out alone. close() stops the fade.
        drawn.fadeIn(opacity => {
            opened.opacity = opacity;
            for (const layer of drawn.layers) layer.alpha = opacity;
            showContent(opened);
            if (opacity >= 1 && opened.isReading) loader.show();
        });
        log(`High Score Board opened, drawn in ${host.now().getTime() - openedAt} ms.`);
        if (!game) return;
        refresh(game.configId).then(safeHandler(SCRIPT_NAME, (status) => {
            opened.isReading = false;
            if (shown !== opened) return;
            loader.hide();
            for (const layer of opened.content) host.removeDrawingLayer(layer);
            // A read whose recording threw resolves to nothing, logged: shown as failed.
            drawContent(opened, screenFor(game, status || "failed", defaultImages));
        }));
    }

    function close() {
        if (!shown) return;
        shown.drawn.close(shown.content);
        shown.marker.remove();
        loader.hide();
        crowns.forEach(hideCrown);
        shown = null;
        closedListeners.tell();
    }

    // Fires on every mapped button press; swallows them all while the
    // screen is open, the flippers scrolling a board longer than the window,
    // Select and Launch choosing the Exit Button, always selected.
    host.on("commandbuttondown", safeHandler(SCRIPT_NAME, ev => {
        // Already handled within the same press by the screen that opened this one.
        if (!shown || ev.defaultPrevented) return;
        ev.preventDefault();
        if (ev.command === "Next" || ev.command === "Prev") scroll(ev.command === "Next" ? 1 : -1);
        if (!["Exit", "Select", "Launch"].includes(ev.command)) return;
        const { onBack } = shown;
        close();
        if (onBack) onBack();
    }));

    // Fires when the cabinet sits idle: the screen must not stay over
    // attract mode nor keep the buttons.
    host.on("attractmodestart", safeHandler(SCRIPT_NAME, close));

    return {
        open,
        isOpen: () => shown !== null,
        onClosed: closedListeners.onClosed,
    };
}
