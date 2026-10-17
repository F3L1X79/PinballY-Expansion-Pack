// ============================================================
// Avatar Frame list module: the drawn list the player opens from the
// Profile Stats' Frame button to choose what the active Profile's Avatar
// wears: one row per Avatar Frame in tier order around the player's own
// Avatar, then "None", laid out by the Avatar Frame list painter. A locked
// row shows the greyed frame and its unlock condition; the worn row is
// marked and the list opens on it. Next / Prev move the Selection Marker
// (a gold glow flowing round the choice) through the Exit Button at the
// top right (the back arrow, its tooltip saying Back), then the rows,
// looping, with PinballY's navigation sound (it may open on another row,
// such as the Reward Prompt's new frame, never on the Exit Button). The
// Button Hints' footer names the flippers, Select and Exit. Select or
// Launch (the plunger) on an unlocked row or "None" saves the choice
// through the Profile Rewards module, on a locked row does nothing; on
// the Exit Button, and Exit, it changes
// nothing. Both then close the list and call the return given to open();
// attract mode only closes it, the marker's layer and timer going with
// it. While open it swallows every button through "commandbuttondown".
// Every layer is drawn ahead from startup through the shared drawing
// ahead, kept from one opening to the next and redrawn only when what it
// shows or the window size changed; what the list shows is read again on
// each opening, and ahead after a Profile switch or a change of a
// Profile's data. It opens at once when its rows are drawn ahead,
// otherwise through the shared screen opening (docs/adr/0014), counting
// as open while it gets ready. Opens directly, not through the wheel
// dialog module: the player asked for it. isOpen() and onClosed() let the
// wheel dialogs wait for it.
// ============================================================

import lang from "../core/i18n.js";
import { safeHandler } from "../core/safe_handler.js";
import { createClosedListeners } from "../core/closed_listeners.js";
import { createNavigationSound } from "../core/navigation_sound.js";
import { STEAMBALL_COLORS } from "../drawing/steamball_palette.js";
import { createSelectionMarker } from "../drawing/selection_marker.js";
import {
    AVATAR_FRAME_LIST_Z_INDEX, REFERENCE_HEIGHT, layoutFrameList, exitTooltipRectOf, drawTitle, drawRow, drawExitButton, drawExitTooltip, drawButtonHints,
} from "./avatar_frame_list_painter.js";
import { drawBackdrop, EXIT_BUTTON_LOOK } from "../drawing/steamball_drawing.js";
import { exitButtonWordOf, buttonHintGroupsOf, FLIPPER_HINT } from "../drawing/button_hints.js";
import { createScreenOpening } from "../drawing/screen_opening.js";

const SCRIPT_NAME = "AvatarFrameList";
const NONE_KEY = "none";
const HIDDEN_SCALE = Object.freeze({ xSpan: 0.001, ySpan: 0.001 });
const WINDOW_SCALE = Object.freeze({ xSpan: 1, ySpan: 1 });
// The selection on the Exit Button rather than on a row; first in the
// Next / Prev loop, as on the Profile Stats.
const EXIT_BUTTON = -1;
// Exit always brings the Profile Stats back.
const EXIT_LOOK = EXIT_BUTTON_LOOK.BACK;
const EXIT_TOOLTIP = "exitTooltip";

// profileRewards: the Profile Rewards module (common/avatar_frames/profile_rewards.js);
// drawingAhead: the shared drawing ahead (common/core/drawing_ahead.js).
export function createAvatarFrameList(host, { profileStore, profileRewards, drawingAhead }) {
    const { profileStats: { frameList: TEXT } } = lang;
    const navigationSound = createNavigationSound(host, SCRIPT_NAME);
    // Shrunk to a point while hidden: PinballY otherwise fills every pixel
    // of a window-sized layer on each frame, even at alpha 0.
    const hide = layer => {
        layer.alpha = 0;
        layer.setScale(HIDDEN_SCALE);
    };
    const hiddenLayer = zIndex => {
        const layer = host.createDrawingLayer(zIndex);
        hide(layer);
        return layer;
    };
    const backdropLayer = hiddenLayer(AVATAR_FRAME_LIST_Z_INDEX.backdrop);
    // By key ("title" or a row's), each with the signature of what
    // it was drawn with.
    const layers = new Map();
    // What the list shows and its layout: null until first read. Stale once
    // something it shows may have changed, and read again ahead while the
    // list is closed.
    let content = null;
    let isContentStale = true;
    // The open list, null when closed: the selected row's index (or
    // EXIT_BUTTON), its
    // Selection Marker (null while getting ready), what Select and Exit
    // return to and whether it is still getting ready.
    let shown = null;
    const opening = createScreenOpening(host, SCRIPT_NAME, { zIndex: AVATAR_FRAME_LIST_Z_INDEX.backdrop - 2, drawingAhead });
    const closedListeners = createClosedListeners(SCRIPT_NAME);

    function readRows() {
        const { avatarPath } = profileStore.getActiveProfile();
        const worn = profileRewards.wornFrameOf();
        const rows = profileRewards.framesOf().map(frame => {
            const isWorn = worn !== null && worn.tier === frame.tier;
            return {
                key: `frame${frame.tier}`, tier: frame.tier, name: frame.name, isLocked: !frame.isUnlocked, isWorn, avatarPath,
                status: frame.isUnlocked ? (isWorn ? TEXT.worn : null) : TEXT.unlockCondition(frame.tier),
                framePath: profileRewards.imageOf(frame, frame.isUnlocked ? "small" : "locked"),
            };
        });
        rows.push({
            key: NONE_KEY, tier: null, name: TEXT.none, isLocked: false, isWorn: worn === null, avatarPath,
            status: worn === null ? TEXT.worn : null, framePath: null,
        });
        return rows;
    }

    // Reads what the list shows (rows, when already read), then draws the
    // backdrop, which measures the window the layout depends on.
    function readContent(rows = readRows()) {
        let geometry = null;
        let referenceWidth = 0;
        backdropLayer.clear(STEAMBALL_COLORS.transparent);
        // Window-sized while it measures: its canvas must be the window's.
        backdropLayer.setScale(WINDOW_SCALE);
        backdropLayer.draw(dc => {
            const size = dc.getSize();
            referenceWidth = REFERENCE_HEIGHT * size.width / size.height;
            geometry = layoutFrameList(referenceWidth, rows.length);
            drawBackdrop(dc, size, REFERENCE_HEIGHT, geometry.panel);
        });
        if (!shown) backdropLayer.setScale(HIDDEN_SCALE);
        content = { rows, geometry, referenceWidth };
        isContentStale = false;
    }

    // Every piece: the title, the Exit Button, its tooltip, the Button
    // Hints, then each row, each { key, rect, zIndex, look, draw(dc) } in
    // its rect's own coordinates.
    function pieces() {
        const { rows, geometry } = content;
        const exitWord = exitButtonWordOf(EXIT_LOOK);
        const hints = buttonHintGroupsOf({ flippers: FLIPPER_HINT.BROWSE, select: true, exitLook: EXIT_LOOK });
        return [
            { key: "title", zIndex: AVATAR_FRAME_LIST_Z_INDEX.title, rect: geometry.title, look: TEXT.title,
                draw: dc => drawTitle(host, dc, TEXT.title, geometry.title.w, geometry.title.h) },
            { key: "exitButton", zIndex: AVATAR_FRAME_LIST_Z_INDEX.exitButton, rect: geometry.exitButton, look: EXIT_LOOK,
                draw: dc => drawExitButton(dc, EXIT_LOOK) },
            { key: EXIT_TOOLTIP, zIndex: AVATAR_FRAME_LIST_Z_INDEX.tooltip, rect: exitTooltipRectOf(geometry.exitButton), look: exitWord,
                draw: dc => drawExitTooltip(host, dc, exitWord) },
            { key: "buttonHints", zIndex: AVATAR_FRAME_LIST_Z_INDEX.buttonHints, rect: geometry.buttonHints, look: hints,
                draw: dc => drawButtonHints(host, dc, hints, geometry.buttonHints.w, geometry.buttonHints.h) },
            ...rows.map((row, index) => ({
                key: row.key, zIndex: AVATAR_FRAME_LIST_Z_INDEX.rows, rect: geometry.rows[index], look: row,
                draw: dc => drawRow(host, dc, row, geometry.rows[index].w, geometry.rows[index].h),
            })),
        ];
    }

    const signatureOf = piece => JSON.stringify([piece.look, piece.rect.w, piece.rect.h]);
    const isDrawn = piece => {
        const record = layers.get(piece.key);
        return record !== undefined && record.signature === signatureOf(piece);
    };

    // The piece's layer, created on first use and drawn again only when its
    // signature changed.
    function layerOf(piece) {
        let record = layers.get(piece.key);
        if (!record) {
            record = { layer: hiddenLayer(piece.zIndex), signature: null };
            layers.set(piece.key, record);
        }
        if (!isDrawn(piece)) {
            record.layer.clear(STEAMBALL_COLORS.transparent);
            record.layer.draw(piece.draw, piece.rect.w, piece.rect.h);
            record.signature = signatureOf(piece);
        }
        return record.layer;
    }

    // Scaled only once shown, so it stays a point while hidden.
    function place(layer, rect) {
        layer.setScale({ ySpan: rect.h / REFERENCE_HEIGHT });
        layer.setPos((rect.x + rect.w / 2) / content.referenceWidth - 0.5, 0.5 - (rect.y + rect.h / 2) / REFERENCE_HEIGHT);
    }

    // One step of the drawing ahead. What the list shows is read again only
    // while it is closed: the open list keeps what it opened with.
    function drawAheadStep() {
        // Nothing to choose: never drawn.
        if (profileRewards.framesOf().length === 0) return false;
        if (!shown && (isContentStale || !content)) {
            readContent();
            return true;
        }
        const piece = pieces().find(candidate => !isDrawn(candidate));
        if (!piece) return false;
        layerOf(piece);
        return true;
    }

    const wakeDrawingAhead = drawingAhead.add(drawAheadStep);

    function markContentStale() {
        isContentStale = true;
        wakeDrawingAhead();
    }

    const selectedRect = () => (shown.selected === EXIT_BUTTON ? content.geometry.exitButton : content.geometry.rows[shown.selected]);

    // Shows the list drawn for it at this opacity, the Selection Marker on
    // the selected choice.
    function show(opacity) {
        backdropLayer.setScale(WINDOW_SCALE);
        for (const piece of pieces()) place(layerOf(piece), piece.rect);
        // Not drawn ahead: it lives only while the list is open, its timer
        // with it.
        shown.marker = createSelectionMarker(host, {
            zIndex: AVATAR_FRAME_LIST_Z_INDEX.marker, referenceWidth: content.referenceWidth, referenceHeight: REFERENCE_HEIGHT,
        });
        shown.marker.moveTo(selectedRect());
        setOpacity(opacity);
    }

    // Each frame of the fade in, and each move. Every layer is drawn by
    // now: no layerOf(), which could draw on the spot within a frame. The
    // Exit Button's tooltip shows only while it is selected.
    function setOpacity(opacity) {
        shown.opacity = opacity;
        backdropLayer.alpha = opacity;
        for (const piece of pieces()) layers.get(piece.key).layer.alpha = opacity;
        if (shown.selected !== EXIT_BUTTON) layers.get(EXIT_TOOLTIP).layer.alpha = 0;
        shown.marker.setOpacity(opacity);
    }

    // onBack: what Select and Exit return to, called once the list is
    // closed; selectedTier (optional): the frame row it opens on instead of
    // the worn one; onClosed (optional): called whenever it closes, attract
    // mode included, before onBack. Opens at once when every row is drawn
    // ahead; otherwise the missing ones are drawn under the veil first.
    function open(onBack = () => {}, { selectedTier = null, onClosed = () => {} } = {}) {
        if (shown) return;
        // Here rather than on the first move, which it would slow down.
        navigationSound.load();
        opening.begin();
        const rows = opening.read(readRows);
        // The backdrop measures the window the rows' layout depends on.
        opening.draw(() => readContent(rows));
        const isOpenedOn = row => (selectedTier === null ? row.isWorn : row.tier === selectedTier);
        shown = { onBack, onClosed, marker: null, opacity: 0, selected: Math.max(0, content.rows.findIndex(isOpenedOn)), isPreparing: false };
        const nextMissing = () => pieces().find(piece => !isDrawn(piece));
        if (!nextMissing()) {
            show(1);
            opening.logOpened();
            return;
        }
        shown.isPreparing = true;
        const step = () => {
            const piece = nextMissing();
            if (!piece) return false;
            opening.draw(() => layerOf(piece));
            return nextMissing() !== undefined;
        };
        opening.runVeiled(step, {
            onDone: () => {
                shown.isPreparing = false;
                show(0);
                opening.logOpened();
                opening.fadeIn(setOpacity);
            },
            // Logged by the drawing ahead: given up rather than left veiled.
            onFailed: close,
        });
    }

    // Closes the open list or gives up the one getting ready.
    function close() {
        if (!shown) return;
        const { onClosed, marker } = shown;
        shown = null;
        opening.remove();
        if (marker) marker.remove();
        hide(backdropLayer);
        for (const { layer } of layers.values()) hide(layer);
        // What changed while it was open is read again once it is closed.
        wakeDrawingAhead();
        onClosed();
        closedListeners.tell();
    }

    // direction: 1 for Next, -1 for Prev, through the Exit Button then
    // each row.
    function move(direction) {
        navigationSound.play();
        // The loop's places: the Exit Button at 0, then the rows.
        const places = content.rows.length + 1;
        shown.selected = ((shown.selected + 1 + direction + places) % places) - 1;
        shown.marker.moveTo(selectedRect());
        setOpacity(shown.opacity);
    }

    function back() {
        const { onBack } = shown;
        close();
        onBack();
    }

    // A locked row cannot be worn: the list stays as it is. The Exit
    // Button goes back as Exit does.
    function choose() {
        if (shown.selected === EXIT_BUTTON) return back();
        const row = content.rows[shown.selected];
        if (row.isLocked) return;
        profileRewards.choose(row.tier);
        back();
    }

    // Fires on every mapped button press; drives the list while it is open.
    host.on("commandbuttondown", safeHandler(SCRIPT_NAME, ev => {
        // Already handled: the Profile Stats' button opened the list within
        // the same press, which must not pick a row too.
        if (!shown || ev.defaultPrevented) return;
        // Swallowed first, so a failing choice still never reaches the wheel.
        ev.preventDefault();
        // Getting ready: Exit gives up, as it would close the open list.
        if (shown.isPreparing) {
            if (ev.command === "Exit") back();
            return;
        }
        if (ev.command === "Next" || ev.command === "Prev") move(ev.command === "Next" ? 1 : -1);
        // Launch is the plunger, which selects in PinballY's own menus too.
        else if (ev.command === "Select" || ev.command === "Launch") choose();
        else if (ev.command === "Exit") back();
    }));

    // Fires when the cabinet sits idle: the list must not stay over attract
    // mode nor keep the buttons.
    host.on("attractmodestart", safeHandler(SCRIPT_NAME, close));

    profileStore.onSwitch(safeHandler(SCRIPT_NAME, markContentStale));
    // Fires after any change of a Profile's data: the Collection Tier kept
    // or the choice may have changed.
    profileStore.onUpdate(safeHandler(SCRIPT_NAME, markContentStale));

    return {
        open,
        isOpen: () => shown !== null,
        onClosed: closedListeners.onClosed,
        // The active Profile's frames unlocked and in all, null when there
        // are none (Table Mastery off).
        count() {
            const frames = profileRewards.framesOf();
            return frames.length === 0 ? null : { unlocked: frames.filter(frame => frame.isUnlocked).length, total: frames.length };
        },
    };
}
