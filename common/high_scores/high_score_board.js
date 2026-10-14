// ============================================================
// High Score Board module: the drawn screen the player opens from the main
// menu to see the selected table's last known board, as the High Score
// store knows it: the table's title, the podium for the three first places
// and compact rows for the others, laid out by the High Score Board
// painter on the Drawn Menu's panel. Each place shows its owner's name and
// Avatar, or "Default score"; "No score yet" when the board is empty or was
// never read. The screen is drawn at once on all its layers, then faded
// in. While open it swallows every button through "commandbuttondown";
// Exit closes it and calls the return given to open(); attract mode only
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
    drawBackdrop, drawPanel, drawGlass, drawTitle, drawMessage, drawStep, drawRow,
} from "./high_score_board_painter.js";

// highScores: the High Score store.
export function createHighScoreBoard(host, { highScores }) {
    const log = message => host.log(`[${SCRIPT_NAME}] ${message}`);
    const closedListeners = createClosedListeners(SCRIPT_NAME);
    const projectFolder = host.getProjectFolder();
    // The screen on show: its drawn layers and return; null when closed.
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

    // The selected table's title and places; none for a table never read.
    function readScreen() {
        const game = host.getCurrentTable();
        const places = game ? highScores.boardOf(game.configId) || [] : [];
        return { title: game ? game.title : "", places: places.map(placeShown) };
    }

    // onBack: what Exit returns to, called once the screen is closed.
    function open(onBack = () => {}) {
        if (shown) return;
        const openedAt = host.now().getTime();
        const TEXT = lang.highScores.board;
        const screen = readScreen();
        let geometry = null;
        const drawn = openDrawnScreen(host, SCRIPT_NAME, {
            referenceHeight: REFERENCE_HEIGHT,
            backdropZIndex: Z_INDEX.backdrop,
            drawBackdrop(dc, size, referenceWidth) {
                geometry = layoutHighScoreBoard(referenceWidth, screen.places.length);
                drawBackdrop(dc, size);
            },
        });
        const { panel } = geometry;
        drawn.drawPiece(Z_INDEX.panel, panel, dc => drawPanel(dc, projectFolder, panel.w, panel.h));
        drawn.drawPiece(Z_INDEX.title, geometry.title, dc => drawTitle(host, dc, screen.title, geometry.title.w, geometry.title.h));
        if (screen.places.length === 0) {
            drawn.drawPiece(Z_INDEX.message, geometry.message, dc => drawMessage(host, dc, TEXT.noScore, geometry.message.w, geometry.message.h));
        }
        screen.places.slice(0, PODIUM_PLACES).forEach((place, index) => {
            const rect = geometry.steps[index];
            drawn.drawPiece(Z_INDEX.podium, rect, dc => drawStep(host, dc, place, index, TEXT.record, rect.w));
        });
        screen.places.slice(PODIUM_PLACES).forEach((place, index) => {
            const rect = geometry.rows[index];
            drawn.drawPiece(Z_INDEX.rows, rect, dc => drawRow(host, dc, place, rect.w));
        });
        drawn.drawPiece(Z_INDEX.glass, panel, dc => drawGlass(dc, projectFolder, panel.w, panel.h));
        shown = { drawn, onBack };
        drawn.fadeIn(opacity => {
            for (const layer of drawn.layers) layer.alpha = opacity;
        });
        log(`High Score Board opened, drawn in ${host.now().getTime() - openedAt} ms.`);
    }

    function close() {
        if (!shown) return;
        shown.drawn.close();
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
