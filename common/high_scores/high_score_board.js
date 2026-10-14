// ============================================================
// High Score Board module: the drawn screen the player opens from the main
// menu to see the selected table's board, as the High Score store knows
// it: the table's title, the podium for the three first places and
// compact rows for the others, laid out by the High Score Board painter on
// the Drawn Menu's panel. Each place shows its owner's name and Avatar, or
// "Default score". Opens at once on the last known board under a
// "Reading..." note (or a "Reading..." message for a table never read) while
// the High Scores Add-on reads it fresh, then redraws in place: the fresh
// board, "No score yet" when empty, a "could not be refreshed" note when
// the read failed, or "not supported" when PINemHi says so or no board is
// known. The screen is drawn at once on all its layers, then faded in.
// While open it swallows every button through "commandbuttondown"; Exit
// closes it and calls the return given to open(); attract mode only
// closes it. Opens directly, not through the wheel dialog module: the
// player asked for it. isOpen() and onClosed() let the wheel dialogs wait
// for it.
// ============================================================

import lang from "../core/i18n.js";
import { displayNameOf } from "../profiles/profile_name.js";
import { safeHandler } from "../core/safe_handler.js";
import { createClosedListeners } from "../core/closed_listeners.js";
import { openDrawnScreen } from "../stats/drawn_screen.js";
import { SCRIPT_NAME } from "./high_score_store.js";
import {
    HIGH_SCORE_BOARD_Z_INDEX as Z_INDEX, REFERENCE_HEIGHT, PODIUM_PLACES, layoutHighScoreBoard,
    drawBackdrop, drawPanel, drawGlass, drawTitle, drawNote, drawMessage, drawStep, drawRow,
} from "./high_score_board_painter.js";

// highScores: the High Score store; refresh(configId): reads the table's
// board into the store, resolving to "read", "unsupported" or "failed".
export function createHighScoreBoard(host, { highScores, refresh }) {
    const log = message => host.log(`[${SCRIPT_NAME}] ${message}`);
    const closedListeners = createClosedListeners(SCRIPT_NAME);
    const projectFolder = host.getProjectFolder();
    // The screen on show: its drawn screen, return, opacity and the layers
    // of its content (all but the backdrop); null when closed.
    let shown = null;

    // The owner's Avatar; null, logged, when its image is missing.
    function avatarOf(owner) {
        if (host.files.isImageReadable(owner.avatarPath)) return owner.avatarPath;
        log(`${owner.avatarPath} is missing or unreadable; ${owner.name}'s places show without an Avatar.`);
        return null;
    }

    function placeShown({ rank, initials, score, owner }) {
        const TEXT = lang.highScores.board;
        return {
            rank,
            name: owner ? displayNameOf(owner) : TEXT.defaultScore,
            isDefaultScore: owner === null,
            avatarPath: owner ? avatarOf(owner) : null,
            initials: initials || TEXT.noInitials,
            score: lang.profileStats.number(score),
            isTableRecord: rank === 1,
        };
    }

    // What the screen shows of the table: its title, its last known
    // places, and the message or note for where the read stands (status:
    // "reading", "read", "unsupported", "failed").
    function screenFor(game, status) {
        const TEXT = lang.highScores.board;
        const known = game ? highScores.boardOf(game.configId) : [];
        const screen = { title: game ? game.title : "", places: [], message: null, note: null };
        if (status === "unsupported" || (known === null && status === "failed")) screen.message = TEXT.notSupported;
        else if (known === null) screen.message = TEXT.reading;
        else if (known.length === 0) {
            screen.message = status === "reading" ? TEXT.reading : TEXT.noScore;
            if (status === "failed") screen.note = TEXT.notRefreshed;
        } else {
            screen.places = known.map(placeShown);
            if (status === "reading") screen.note = TEXT.reading;
            if (status === "failed") screen.note = TEXT.notRefreshed;
        }
        return screen;
    }

    // Draws the panel and everything on it into opened.content, at the
    // screen's current opacity; the backdrop stays.
    function drawContent(opened, screen) {
        const TEXT = lang.highScores.board;
        const { drawn } = opened;
        const geometry = layoutHighScoreBoard(drawn.referenceWidth, screen.places.length);
        const content = [];
        const piece = (zIndex, rect, draw) => drawn.drawPiece(zIndex, rect, draw, content);
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
        screen.places.slice(PODIUM_PLACES).forEach((place, index) => {
            const rect = geometry.rows[index];
            piece(Z_INDEX.rows, rect, dc => drawRow(host, dc, place, rect.w));
        });
        piece(Z_INDEX.glass, panel, dc => drawGlass(dc, projectFolder, panel.w, panel.h));
        for (const layer of content) layer.alpha = opened.opacity;
        opened.content = content;
    }

    // onBack: what Exit returns to, called once the screen is closed.
    // Opens at once on the last known board and redraws in place when the
    // fresh read ends; a read ending after close only updated the store.
    function open(onBack = () => {}) {
        if (shown) return;
        const openedAt = host.now().getTime();
        const game = host.getCurrentTable();
        const drawn = openDrawnScreen(host, SCRIPT_NAME, {
            referenceHeight: REFERENCE_HEIGHT,
            backdropZIndex: Z_INDEX.backdrop,
            drawBackdrop,
        });
        const opened = { drawn, onBack, opacity: 0, content: [] };
        shown = opened;
        drawContent(opened, screenFor(game, game ? "reading" : "read"));
        drawn.fadeIn(opacity => {
            opened.opacity = opacity;
            for (const layer of [...drawn.layers, ...opened.content]) layer.alpha = opacity;
        });
        log(`High Score Board opened, drawn in ${host.now().getTime() - openedAt} ms.`);
        if (!game) return;
        refresh(game.configId).then(safeHandler(SCRIPT_NAME, (status) => {
            if (shown !== opened) return;
            for (const layer of opened.content) host.removeDrawingLayer(layer);
            // A read whose recording threw resolves to nothing, logged: shown as failed.
            drawContent(opened, screenFor(game, status || "failed"));
        }));
    }

    function close() {
        if (!shown) return;
        shown.drawn.close(shown.content);
        shown = null;
        closedListeners.tell();
    }

    // Fires on every mapped button press; swallows them all while the screen is open.
    host.on("commandbuttondown", safeHandler(SCRIPT_NAME, ev => {
        // Already handled within the same press by the screen that opened this one.
        if (!shown || ev.defaultPrevented) return;
        ev.preventDefault();
        if (ev.command !== "Exit") return;
        const { onBack } = shown;
        close();
        onBack();
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
