// ============================================================
// Drawn Menu module: the single place that shows a menu in the pack's
// Steamball look (see docs/adr/0013) instead of PinballY's native one.
// show() takes PinballY's own menu items, drops the paging entries, turns
// a titled static item into a heading the cursor skips, collapses the
// separators and draws one centred list in a panel over a dimmed wheel,
// with a glass over it, the cursor on the item marked "selected" (else
// the first entry); a dialog's message shows above the list. When the
// Drawn Menus Add-on is off, or the menu cannot be drawn (logged), it
// shows PinballY's native menu instead, and reports its "menuclose"
// through the same onClose. draw(), for the Drawn Menus Add-on, returns
// false instead of showing the native menu.
// While it is open, every button is swallowed through
// "commandbuttondown": Next / Prev move the selection, wrapping, with
// PinballY's navigation sound, the gold text landing at once on the new
// entry while the gold outline glides to it;
// NextPage / PrevPage move by a page; Select or Launch plays the Select
// sound, closes the menu (unless the entry stays open) and runs the
// entry's command through doCommand, as a native menu would, then
// reports the close; Exit plays the Deselect sound and closes it. Attract
// mode closes it too, and so does a menu shown in its place. isOpen() and
// onClosed() let what waits for a free wheel wait for it.
// The button sounds are loaded and the painted images (panel, glass,
// selection outline) drawn on layers ahead through the shared drawing
// ahead; the images are drawn again when the window size changes, only
// placed and scaled on each opening, and shrunk to a dot while hidden.
// The texts are drawn on opening, again only when they changed. The menu
// fades in; it never changes PinballY's UI mode. Each opening's time is
// logged, part by part.
// ============================================================

import { safeHandler } from "./safe_handler.js";
import { createPinballYHost } from "./pinbally_host.js";
import config from "./config.js";
import { getDrawingAhead } from "./drawing_ahead.js";
import { createButtonSound, createNavigationSound } from "./navigation_sound.js";
import { DRAWN_MENU_IMAGES, DRAWN_MENU_IMAGES_FOLDER } from "./drawn_menu_images.js";
import {
    DRAWN_MENU_Z_INDEX, DRAWN_MENU_LOOK, ROW_KIND, pointsOf, computeGeometry, rowHeightIn, drawTexts, drawSelectedText, drawBackdrop, selectionSize,
} from "./drawn_menu_painter.js";
import { STEAMBALL_FONTS as FONTS } from "./steamball_palette.js";

const SCRIPT_NAME = "DrawnMenus";

const TRANSPARENT = 0x00000000;
const FADE_MS = 100;
const FRAME_MS = 16;
// The glide slows down as it arrives (exponential ease-out).
const GLIDE_TIME_CONSTANT_MS = 40;
const GLIDE_SNAP_PX = 0.5;
// A hidden layer shrunk to a dot: PinballY would otherwise fill every
// pixel of the window with it at each frame, even invisible.
const DOT_SCALE = Object.freeze({ xSpan: 0.001, ySpan: 0.001 });
const SEPARATOR_CMD = -1;

// PinballY's own items, as plain copies of what the menu shows: its item
// objects are not kept past the event.
const copyItem = item => ({
    title: item.title || "",
    cmd: typeof item.cmd === "number" ? item.cmd : SEPARATOR_CMD,
    selected: Boolean(item.selected),
    checked: Boolean(item.checked),
    radio: Boolean(item.radio),
    hasSubmenu: Boolean(item.hasSubmenu),
    stayOpen: Boolean(item.stayOpen),
});

const markNameOf = item => {
    if (item.checked) return "check";
    if (item.radio) return "radio";
    return item.hasSubmenu ? "submenu" : null;
};

// What the menu shows: its message (dialogs only: the first static
// item) and its rows, the cursor on the selected entry; null when it has
// no entry to choose.
export function buildMenuModel(items, { dialogStyle = false, pagingCommands = [] } = {}) {
    let message = null;
    const rows = [];
    for (const item of items.map(copyItem)) {
        if (pagingCommands.includes(item.cmd)) continue;
        if (item.cmd >= 0) {
            rows.push({ kind: ROW_KIND.ENTRY, title: item.title, cmd: item.cmd, mark: markNameOf(item), stayOpen: item.stayOpen, selected: item.selected });
        } else if (item.title !== "" && dialogStyle && message === null && rows.length === 0) {
            message = item.title;
        } else if (item.title !== "") {
            rows.push({ kind: ROW_KIND.HEADING, title: item.title });
        } else if (rows.length > 0 && rows[rows.length - 1].kind !== ROW_KIND.SEPARATOR) {
            rows.push({ kind: ROW_KIND.SEPARATOR });
        }
    }
    while (rows.length > 0 && rows[rows.length - 1].kind === ROW_KIND.SEPARATOR) rows.pop();
    const entries = rows.map((row, index) => index).filter(index => rows[index].kind === ROW_KIND.ENTRY);
    if (entries.length === 0) return null;
    const selected = entries.find(index => rows[index].selected);
    return { message, rows, entries, selected: selected === undefined ? entries[0] : selected };
}

// PinballY's own menus, behind the same show() as the Drawn Menus: each
// onClose runs on the "menuclose" of its menu's id.
export function createNativeMenus(host) {
    const waitingCloses = [];

    function show(id, items, { dialogStyle = false, onClose = null } = {}) {
        host.showMenu(id, items, dialogStyle ? { dialogStyle: true } : {});
        if (onClose) waitingCloses.push({ id, onClose });
    }

    // Fires after any menu closes, chosen, dismissed or replaced.
    host.on("menuclose", safeHandler(SCRIPT_NAME, ev => {
        const index = waitingCloses.findIndex(waiting => waiting.id === ev.id);
        if (index === -1) return;
        const [{ onClose }] = waitingCloses.splice(index, 1);
        onClose();
    }));

    // A native menu leaves the wheel's UI mode, and "wheelmode" fires on
    // its close: nothing to wait for here.
    return { show, isOpen: () => false, onClosed() {} };
}

// drawingAhead: the shared drawing ahead (common/drawing_ahead.js);
// nativeMenus: what shows a menu that cannot be drawn.
export function createDrawnMenus(host, { drawingAhead, nativeMenus = createNativeMenus(host) }) {
    const imagesFolder = `${host.getProjectFolder()}\\${DRAWN_MENU_IMAGES_FOLDER}`;
    const pagingCommands = [host.getBuiltInCommand("MenuPageUp"), host.getBuiltInCommand("MenuPageDown")];
    const sounds = {
        move: createNavigationSound(host, SCRIPT_NAME),
        // One player each: choosing or Exit closes the menu.
        select: createButtonSound(host, SCRIPT_NAME, "Select", 1),
        deselect: createButtonSound(host, SCRIPT_NAME, "Deselect", 1),
    };

    function hide(layer) {
        layer.alpha = 0;
        layer.setScale(DOT_SCALE);
    }
    const hiddenLayer = zIndex => {
        const layer = host.createDrawingLayer(zIndex);
        hide(layer);
        return layer;
    };
    const backdrop = hiddenLayer(DRAWN_MENU_Z_INDEX.backdrop);
    const textsLayer = hiddenLayer(DRAWN_MENU_Z_INDEX.texts);
    const selectedTextLayer = hiddenLayer(DRAWN_MENU_Z_INDEX.selectedText);
    // The painted images, each drawn for the window size in its signature.
    const imageLayer = (image, zIndex, stretched = false) => ({ image, stretched, layer: hiddenLayer(zIndex), signature: null });
    const panel = ["top", "middle", "bottom"].map(part => imageLayer(DRAWN_MENU_IMAGES.panel[part], DRAWN_MENU_Z_INDEX.panel, part === "middle"));
    const glass = ["top", "middle", "bottom"].map(part => imageLayer(DRAWN_MENU_IMAGES.glass[part], DRAWN_MENU_Z_INDEX.glass, part === "middle"));
    const outline = imageLayer(DRAWN_MENU_IMAGES.selection, DRAWN_MENU_Z_INDEX.selection);
    const images = [...panel, outline, ...glass];
    const allLayers = [backdrop, textsLayer, selectedTextLayer, ...images.map(record => record.layer)];

    // The window's size, measured on each opening and before drawing ahead.
    let windowSize = null;
    const windowSignature = () => `${windowSize.width}x${windowSize.height}`;
    // The open menu, null when closed: its model, layout, scroll and the
    // selection's place on screen while it glides.
    let shown = null;
    // What the texts' layer was drawn with; null when it holds nothing.
    let textsSignature = null;
    const closedListeners = [];

    // Draws the backdrop on a window-sized canvas, which also measures the window.
    function measure() {
        backdrop.clear(TRANSPARENT);
        backdrop.draw(dc => {
            windowSize = dc.getSize();
            drawBackdrop(dc);
        });
    }

    // At its size in this window, stretched later for a middle slice.
    function drawImage(record) {
        const k = windowSize.height / DRAWN_MENU_LOOK.referenceHeight;
        const width = Math.max(1, Math.round(record.image.width * k));
        const height = Math.max(1, Math.round(record.image.height * k));
        record.layer.clear(TRANSPARENT);
        record.layer.draw(dc => dc.drawImage(`${imagesFolder}\\${record.image.file}`, 0, 0, width, height), width, height);
        record.signature = windowSignature();
    }

    // One step of the drawing ahead: the window's size, then each image.
    function drawAheadStep() {
        if (shown) return false;
        // Not drawing, but as slow: loading a sound creates its players.
        const sound = Object.values(sounds).find(candidate => !candidate.isLoaded());
        if (sound) {
            sound.load();
            return true;
        }
        if (!windowSize) {
            measure();
            return true;
        }
        const record = images.find(candidate => candidate.signature !== windowSignature());
        if (!record) return false;
        drawImage(record);
        return true;
    }

    drawingAhead.add(drawAheadStep);

    // The layer's box in window pixels; stretched to it, or scaled by its height.
    function place(layer, { x, y, width, height }, stretched) {
        const { width: windowWidth, height: windowHeight } = windowSize;
        layer.setScale(stretched ? { xSpan: width / windowWidth, ySpan: height / windowHeight } : { ySpan: height / windowHeight });
        layer.setPos((x + width / 2) / windowWidth - 0.5, 0.5 - (y + height / 2) / windowHeight);
    }

    // A top, a middle stretched to the panel's length and a bottom; the
    // middle is hidden when the ends already meet.
    function placeStack([top, middle, bottom], box, k) {
        const topHeight = top.image.height * k;
        const bottomHeight = bottom.image.height * k;
        const middleHeight = box.height - topHeight - bottomHeight;
        place(top.layer, { ...box, height: topHeight }, false);
        place(bottom.layer, { ...box, y: box.y + box.height - bottomHeight, height: bottomHeight }, false);
        if (middleHeight < 0.5) {
            hide(middle.layer);
            return [top.layer, bottom.layer];
        }
        place(middle.layer, { ...box, y: box.y + topHeight, height: middleHeight }, true);
        return [top.layer, middle.layer, bottom.layer];
    }

    // size: in pixels, as the painter's look gives it.
    function messageHeightAt(width, size) {
        const styled = host.createStyledText({
            textAlign: "center",
            textStyle: { font: FONTS.body, size: pointsOf(size), weight: DRAWN_MENU_LOOK.message.weight, color: DRAWN_MENU_LOOK.colors.message },
        });
        styled.add(shown.model.message);
        return styled.measure(width).height;
    }

    // Kept from one opening to the next and drawn again only when what it
    // shows changed: the texts are most of an opening's time, and the main
    // menu usually shows the same entries.
    function drawTextsLayer() {
        const { geometry, model } = shown;
        const width = Math.max(1, Math.round(geometry.listWidth));
        const height = Math.max(1, Math.round(geometry.contentHeight));
        const rows = model.rows.map(({ kind, title, mark }) => [kind, title, mark]);
        const signature = JSON.stringify([model.message, rows, shown.scroll, width, height, geometry.k]);
        if (signature !== textsSignature) {
            textsLayer.clear(TRANSPARENT);
            textsLayer.draw(dc => drawTexts(host, dc, geometry, model, shown.scroll), width, height);
            textsSignature = signature;
        }
        place(textsLayer, { x: geometry.listX, y: geometry.contentTop, width, height }, false);
    }

    // The selected entry's middle in window pixels, at the current scroll.
    function selectedCenterY() {
        const { geometry, model } = shown;
        const row = model.rows[model.selected];
        return geometry.contentTop + geometry.areaOffset + geometry.rowTops[model.selected] - shown.scroll + rowHeightIn(geometry, row) / 2;
    }

    function drawSelectedTextLayer() {
        const { geometry, model } = shown;
        const width = Math.max(1, Math.round(geometry.listWidth));
        const height = Math.max(1, Math.round(DRAWN_MENU_LOOK.rowHeights.entry * geometry.k));
        selectedTextLayer.clear(TRANSPARENT);
        selectedTextLayer.draw(dc => drawSelectedText(host, dc, geometry, model.rows[model.selected]), width, height);
        shown.selectedTextSize = { width, height };
    }

    // The outline and the gold text, centred on this height.
    // The outline, centred on this height while it glides.
    function placeOutline(centerY) {
        const { geometry } = shown;
        const size = selectionSize(geometry);
        place(outline.layer, { x: geometry.listX - size.margin, y: centerY - size.height / 2, width: size.width, height: size.height }, false);
        shown.glideY = centerY;
    }

    // The gold text, right on the selected entry: gliding with the outline,
    // the new title would cross the other entries' white text.
    function placeSelectedText() {
        const { width, height } = shown.selectedTextSize;
        place(selectedTextLayer, { x: shown.geometry.listX, y: selectedCenterY() - height / 2, width, height }, false);
    }

    function stopTimers() {
        if (!shown) return;
        for (const key of ["fadeTimer", "glideTimer"]) {
            if (shown[key] !== null) host.clearInterval(shown[key]);
            shown[key] = null;
        }
    }

    function setAlpha(alpha) {
        for (const layer of shown.layers) layer.alpha = alpha;
    }

    // Runs every frame while the menu fades in; timed on the clock, since
    // Windows timers fire late.
    function fadeStep() {
        const progress = Math.min(1, (host.now().getTime() - shown.fadeStartMs) / FADE_MS);
        setAlpha(progress);
        if (progress < 1) return;
        host.clearInterval(shown.fadeTimer);
        shown.fadeTimer = null;
    }

    // Keeps the selected entry and its neighbours in view.
    function scrollToSelected() {
        const { geometry, model } = shown;
        const index = model.selected;
        const before = Math.max(0, index - 1);
        const after = Math.min(model.rows.length - 1, index + 1);
        let scroll = shown.scroll;
        const afterBottom = geometry.rowTops[after] + rowHeightIn(geometry, model.rows[after]);
        if (geometry.rowTops[before] < scroll) scroll = geometry.rowTops[before];
        if (afterBottom > scroll + geometry.areaHeight) scroll = afterBottom - geometry.areaHeight;
        shown.scroll = Math.max(0, Math.min(Math.max(0, geometry.rowsHeight - geometry.areaHeight), scroll));
    }

    // Returns how long each part took, in ms, for the log.
    function open(id, model, onClose) {
        const timings = {};
        let partStartMs = host.now().getTime();
        const lap = name => {
            const nowMs = host.now().getTime();
            timings[name] = nowMs - partStartMs;
            partStartMs = nowMs;
        };
        for (const sound of Object.values(sounds)) sound.load();
        lap("sounds");
        measure();
        lap("measure");
        // PinballY tells no script of a new window size: only this measure
        // sees it, so the images drawn for the old size are drawn again here.
        for (const record of images) if (record.signature !== windowSignature()) drawImage(record);
        lap("images");
        shown = { id, model, onClose, geometry: null, scroll: 0, layers: [], fadeTimer: null, glideTimer: null, fadeStartMs: 0, glideLastMs: 0, glideY: 0 };
        shown.geometry = computeGeometry(windowSize, model, messageHeightAt);
        const { geometry } = shown;
        scrollToSelected();
        drawTextsLayer();
        lap("texts");
        drawSelectedTextLayer();
        lap("selection");
        placeSelectedText();
        placeOutline(selectedCenterY());
        backdrop.setScale({ xSpan: 1, ySpan: 1 });
        backdrop.setPos(0, 0);
        shown.layers = [
            backdrop,
            ...placeStack(panel, geometry.panel, geometry.k),
            textsLayer, outline.layer, selectedTextLayer,
            ...placeStack(glass, geometry.panel, geometry.k),
        ];
        setAlpha(0);
        shown.fadeStartMs = host.now().getTime();
        shown.fadeTimer = host.setInterval(safeHandler(SCRIPT_NAME, fadeStep), FRAME_MS);
        return timings;
    }

    // Hides the menu without reporting its close; returns its onClose.
    // Also clears what a failed drawing left.
    function takeDown() {
        const onClose = shown ? shown.onClose : null;
        stopTimers();
        shown = null;
        for (const layer of allLayers) hide(layer);
        return onClose;
    }

    // After the menu's own onClose: what waited for a free wheel checks
    // isOpen() itself, since a command may have opened another menu.
    function reportClosed(onClose) {
        if (!onClose) return;
        onClose();
        for (const listener of closedListeners) listener();
    }

    function close() {
        reportClosed(takeDown());
    }

    // Draws the menu; false, with the error logged and nothing left
    // drawn, when it cannot, or when it has no entry to choose.
    function draw(id, items, { dialogStyle = false, onClose = null } = {}) {
        const startMs = host.now().getTime();
        close();
        try {
            const model = buildMenuModel(items, { dialogStyle, pagingCommands });
            if (!model) return false;
            const timings = open(id, model, safeHandler(SCRIPT_NAME, onClose || (() => {})));
            const parts = Object.entries(timings).map(([name, ms]) => `${name} ${ms}`).join(", ");
            host.log(`[${SCRIPT_NAME}] "${id}" opened in ${host.now().getTime() - startMs} ms (${model.entries.length} entries; ${parts}).`);
            return true;
        } catch (error) {
            takeDown();
            host.log(`[${SCRIPT_NAME}] ERROR drawing the "${id}" menu, the native one shows instead: ${error.stack || error.message}`);
            return false;
        }
    }

    function show(id, items, options = {}) {
        if (!draw(id, items, options)) nativeMenus.show(id, items, options);
    }

    // Runs every frame while the selection glides to its entry.
    function glideStep() {
        const nowMs = host.now().getTime();
        const remaining = Math.exp(-(nowMs - shown.glideLastMs) / GLIDE_TIME_CONSTANT_MS);
        shown.glideLastMs = nowMs;
        const target = selectedCenterY();
        const y = target + (shown.glideY - target) * remaining;
        if (Math.abs(y - target) >= GLIDE_SNAP_PX) {
            placeOutline(y);
            return;
        }
        placeOutline(target);
        host.clearInterval(shown.glideTimer);
        shown.glideTimer = null;
    }

    // To the entry at this place among the entries; a wrap jumps instead
    // of gliding across the whole list.
    function selectEntry(position, wrapped) {
        const { model } = shown;
        const previousScroll = shown.scroll;
        sounds.move.play();
        model.selected = model.entries[position];
        scrollToSelected();
        drawSelectedTextLayer();
        const jumps = wrapped || shown.scroll !== previousScroll;
        if (shown.scroll !== previousScroll) drawTextsLayer();
        placeSelectedText();
        if (jumps) {
            if (shown.glideTimer !== null) host.clearInterval(shown.glideTimer);
            shown.glideTimer = null;
            placeOutline(selectedCenterY());
            return;
        }
        if (shown.glideTimer === null) {
            shown.glideLastMs = host.now().getTime();
            shown.glideTimer = host.setInterval(safeHandler(SCRIPT_NAME, glideStep), FRAME_MS);
        }
    }

    const currentPosition = () => shown.model.entries.indexOf(shown.model.selected);

    // direction: 1 for Next, -1 for Prev, wrapping.
    function move(direction) {
        const count = shown.model.entries.length;
        const position = currentPosition() + direction;
        selectEntry((position + count) % count, position < 0 || position >= count);
    }

    // By the entries one list area holds, stopping at the ends.
    function movePage(direction) {
        const { geometry, model } = shown;
        const step = Math.max(1, Math.floor(geometry.areaHeight / (DRAWN_MENU_LOOK.rowHeights.entry * geometry.k)) - 1);
        selectEntry(Math.max(0, Math.min(model.entries.length - 1, currentPosition() + direction * step)), false);
    }

    // The close is reported after the command, as PinballY's "menuclose"
    // follows its "command"; even when the command fails, for a wheel
    // dialog's queue not to stay held.
    function choose() {
        const row = shown.model.rows[shown.model.selected];
        sounds.select.play();
        const onClose = row.stayOpen ? null : takeDown();
        try {
            host.doCommand(row.cmd);
        } finally {
            reportClosed(onClose);
        }
    }

    // Fires on every mapped button press; drives the menu while it is open.
    host.on("commandbuttondown", safeHandler(SCRIPT_NAME, ev => {
        // A press already handled may be the one that opened it.
        if (!shown || ev.defaultPrevented) return;
        // Swallowed first, so a failing move still never reaches the wheel.
        ev.preventDefault();
        if (ev.command === "Next") move(1);
        else if (ev.command === "Prev") move(-1);
        else if (ev.command === "NextPage") movePage(1);
        else if (ev.command === "PrevPage") movePage(-1);
        else if (ev.command === "Select" || ev.command === "Launch") choose();
        else if (ev.command === "Exit") {
            sounds.deselect.play();
            close();
        }
    }));

    // Fires when the cabinet sits idle: the menu closes without choosing.
    host.on("attractmodestart", safeHandler(SCRIPT_NAME, close));

    // listener: runs, guarded, each time a Drawn Menu closes; a Drawn Menu
    // never changes the UI mode, so no "wheelmode" follows.
    function onClosed(listener) {
        closedListeners.push(safeHandler(SCRIPT_NAME, listener));
    }

    return { show, draw, close, isOpen: () => shown !== null, onClosed };
}

let sharedDrawnMenus = null;

// One for the whole pack, so a single menu shows at a time; PinballY's
// own menus, with nothing drawn ahead, when the Drawn Menus Add-on is off.
export function getDrawnMenus() {
    if (!sharedDrawnMenus) {
        const host = createPinballYHost();
        sharedDrawnMenus = config.addOns.drawnMenus === false
            ? createNativeMenus(host)
            : createDrawnMenus(host, { drawingAhead: getDrawingAhead() });
    }
    return sharedDrawnMenus;
}
