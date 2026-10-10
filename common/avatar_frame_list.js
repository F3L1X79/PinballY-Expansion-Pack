// ============================================================
// Avatar Frame list module: the drawn list the player opens from the
// Profile Stats' Frame button to choose what the active Profile's Avatar
// wears: one row per Avatar Frame in tier order around the player's own
// Avatar, then "None", laid out by the Avatar Frame list painter. A locked
// row shows the greyed frame and its unlock condition; the worn row is
// marked and the list opens on it. Next / Prev move a gold halo through
// the rows, looping, with PinballY's navigation sound (it may open on
// another row, such as the Reward Prompt's new frame); Select or Launch
// (the plunger) on an unlocked row or "None" saves the choice through the
// Profile Rewards module, on a locked row does nothing; Exit changes
// nothing. Both then close the list and call the return given to open();
// attract mode only closes it. While open it swallows every button
// through "commandbuttondown".
// Every layer is drawn ahead from startup through the shared drawing
// ahead, kept from one opening to the next and redrawn only when what it
// shows or the window size changed; what the list shows is read again on
// each opening, and ahead after a Profile switch or a change of a
// Profile's data. Opens directly, not through the wheel dialog module:
// the player asked for it. isOpen() and onClosed() let the wheel dialogs
// wait for it.
// ============================================================

import lang from "./i18n.js";
import { safeHandler } from "./safe_handler.js";
import { createClosedListeners } from "./closed_listeners.js";
import { createNavigationSound } from "./navigation_sound.js";
import { STEAMBALL_COLORS } from "./steamball_palette.js";
import {
    AVATAR_FRAME_LIST_Z_INDEX, REFERENCE_HEIGHT, layoutFrameList, haloRectOf, drawTitle, drawRow, drawHalo,
} from "./avatar_frame_list_painter.js";
import { drawBackdrop } from "./steamball_drawing.js";

const SCRIPT_NAME = "AvatarFrameList";
const NONE_KEY = "none";
const HIDDEN_SCALE = Object.freeze({ xSpan: 0.001, ySpan: 0.001 });
const WINDOW_SCALE = Object.freeze({ xSpan: 1, ySpan: 1 });

// profileRewards: the Profile Rewards module (common/profile_rewards.js);
// drawingAhead: the shared drawing ahead (common/drawing_ahead.js).
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
    // By key ("title", "halo", or a row's), each with the signature of what
    // it was drawn with.
    const layers = new Map();
    // What the list shows and its layout: null until first read. Stale once
    // something it shows may have changed, and read again ahead while the
    // list is closed.
    let content = null;
    let isContentStale = true;
    // The open list, null when closed: the highlighted row's index and what
    // Select and Exit return to.
    let shown = null;
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

    // Reads what the list shows, then draws the backdrop, which measures
    // the window the layout depends on.
    function readContent() {
        const rows = readRows();
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

    // Every piece: the title, the halo, then each row, each { key, rect,
    // zIndex, look, draw(dc) } in its rect's own coordinates. The halo is
    // drawn once for the rows' size and only moved.
    function pieces() {
        const { rows, geometry } = content;
        const haloRect = haloRectOf(geometry.rows[0]);
        return [
            { key: "title", zIndex: AVATAR_FRAME_LIST_Z_INDEX.title, rect: geometry.title, look: TEXT.title,
                draw: dc => drawTitle(host, dc, TEXT.title, geometry.title.w, geometry.title.h) },
            { key: "halo", zIndex: AVATAR_FRAME_LIST_Z_INDEX.highlight, rect: haloRect, look: null,
                draw: dc => drawHalo(dc, haloRect.w, haloRect.h) },
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

    function placeHalo() {
        const halo = pieces().find(piece => piece.key === "halo");
        place(layerOf(halo), haloRectOf(content.geometry.rows[shown.selected]));
    }

    // onBack: what Select and Exit return to, called once the list is
    // closed; selectedTier (optional): the frame row it opens on instead of
    // the worn one; onClosed (optional): called whenever it closes, attract
    // mode included, before onBack. Anything not drawn ahead yet is drawn
    // on the spot.
    function open(onBack = () => {}, { selectedTier = null, onClosed = () => {} } = {}) {
        if (shown) return;
        // Here rather than on the first move, which it would slow down.
        navigationSound.load();
        readContent();
        backdropLayer.setScale(WINDOW_SCALE);
        backdropLayer.alpha = 1;
        for (const piece of pieces()) {
            const layer = layerOf(piece);
            place(layer, piece.rect);
            layer.alpha = 1;
        }
        const isOpenedOn = row => (selectedTier === null ? row.isWorn : row.tier === selectedTier);
        shown = { onBack, onClosed, selected: Math.max(0, content.rows.findIndex(isOpenedOn)) };
        placeHalo();
    }

    function close() {
        if (!shown) return;
        const { onClosed } = shown;
        shown = null;
        hide(backdropLayer);
        for (const { layer } of layers.values()) hide(layer);
        // What changed while it was open is read again once it is closed.
        wakeDrawingAhead();
        onClosed();
        closedListeners.tell();
    }

    // direction: 1 for Next, -1 for Prev.
    function move(direction) {
        navigationSound.play();
        const count = content.rows.length;
        shown.selected = (shown.selected + direction + count) % count;
        placeHalo();
    }

    function back() {
        const { onBack } = shown;
        close();
        onBack();
    }

    // A locked row cannot be worn: the list stays as it is.
    function choose() {
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
