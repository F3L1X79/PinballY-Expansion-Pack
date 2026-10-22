// ============================================================
// Drawn Menu: the single place that shows a menu in the Steamball look (see
// docs/adr/0013) instead of PinballY's native one. show() runs the chosen
// entry's command as a native menu would, falling back to the native menu
// when the Add-on is off or drawing fails; draw() returns false instead.
// - Swallows every button through "commandbuttondown" while open; never changes the UI mode.
// - A menu with onBack (a submenu) goes back on Exit and on its MenuReturn entry.
// - With keepNative (the pause menu), it closes on the native "menuclose", or at "postlaunch".
// - Images are drawn ahead, only placed on opening, shrunk to a dot while hidden.
// - isOpen() and onClosed() let what waits for a free wheel wait for it.
// ============================================================

import { safeHandler } from "../core/safe_handler.js";
import { createClosedListeners } from "../core/closed_listeners.js";
import { createPinballYHost } from "../core/pinbally_host.js";
import config from "../core/config.js";
import { getDrawingAhead } from "../core/drawing_ahead.js";
import { createButtonSound, createNavigationSound } from "../core/navigation_sound.js";
import { DRAWN_MENU_IMAGES, DRAWN_MENU_IMAGES_FOLDER } from "./drawn_menu_images.js";
import {
    DRAWN_MENU_Z_INDEX, DRAWN_MENU_LOOK, ROW_KIND, pointsOf, computeGeometry, menuScaleOf, drawTexts, drawSelectedText, drawBackdrop, selectionSize,
} from "./drawn_menu_painter.js";

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
// item), its rows, the cursor on the selected entry, and its footer
// ({ label, name } or null); null when it has no entry to choose.
export function buildMenuModel(items, { dialogStyle = false, pagingCommands = [], footer = null } = {}) {
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
    return { message, rows, entries, selected: selected === undefined ? entries[0] : selected, footer };
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

// drawingAhead: the shared drawing ahead (common/core/drawing_ahead.js);
// nativeMenus: what shows a menu that cannot be drawn.
export function createDrawnMenus(host, { drawingAhead, nativeMenus = createNativeMenus(host) }) {
    const imagesFolder = `${host.getProjectFolder()}\\${DRAWN_MENU_IMAGES_FOLDER}`;
    const pagingCommands = [host.getBuiltInCommand("MenuPageUp"), host.getBuiltInCommand("MenuPageDown")];
    const menuReturnCommand = host.getBuiltInCommand("MenuReturn");
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
    const closedListeners = createClosedListeners(SCRIPT_NAME);

    // Draws the backdrop on a window-sized canvas, which also measures the window.
    function measure(covering = false) {
        backdrop.clear(TRANSPARENT);
        backdrop.draw(dc => {
            windowSize = dc.getSize();
            drawBackdrop(dc, covering);
        });
    }

    // At the menu's size in this window, stretched later for a middle slice.
    function drawImage(record) {
        const k = menuScaleOf(windowSize);
        const width = Math.max(1, Math.round(record.image.width * k));
        const height = Math.max(1, Math.round(record.image.height * k));
        record.layer.clear(TRANSPARENT);
        record.layer.draw(dc => dc.drawImage(`${imagesFolder}\\${record.image.file}`, 0, 0, width, height), width, height);
        record.size = { width, height };
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

    // A texts' layer, drawn at its size, on whole pixels: between two,
    // PinballY's filtering spreads each 1 px line (a separator) over two
    // faint rows and blurs the letters.
    function placeText(layer, box) {
        place(layer, { ...box, x: Math.round(box.x), y: Math.round(box.y) }, false);
    }

    // A top, a middle stretched to the panel's length and a bottom; the
    // middle is hidden when the ends already meet. The ends are shown at
    // their drawn size on whole pixels: resampled, PinballY's filtering
    // blends an end's first row with its last (the panel's light edge, the
    // glass's dark one), a 1 px line across the panel.
    function placeStack([top, middle, bottom], box) {
        const x = Math.round(box.x);
        const topY = Math.round(box.y);
        const bottomY = Math.round(box.y + box.height) - bottom.size.height;
        const width = top.size.width;
        place(top.layer, { x, y: topY, width, height: top.size.height }, false);
        place(bottom.layer, { x, y: bottomY, width, height: bottom.size.height }, false);
        const middleY = topY + top.size.height;
        if (bottomY - middleY < 1) {
            hide(middle.layer);
            return [top.layer, bottom.layer];
        }
        place(middle.layer, { x, y: middleY, width, height: bottomY - middleY }, true);
        return [top.layer, middle.layer, bottom.layer];
    }

    // A text wrapped in width; sizePx: in pixels, as the painter's look gives it.
    function wrappedHeightAt(str, width, { font, sizePx, weight }) {
        const styled = host.createStyledText({ textAlign: "center", textStyle: { font, size: pointsOf(sizePx), weight } });
        styled.add(str);
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
        const signature = JSON.stringify([model.message, rows, model.footer, shown.scroll, width, height, geometry.k]);
        if (signature !== textsSignature) {
            textsLayer.clear(TRANSPARENT);
            textsLayer.draw(dc => drawTexts(host, dc, geometry, model, shown.scroll), width, height);
            textsSignature = signature;
        }
        placeText(textsLayer, { x: geometry.listX, y: geometry.contentTop, width, height });
    }

    // The selected entry's middle in window pixels, at the current scroll.
    function selectedCenterY() {
        const { geometry, model } = shown;
        return geometry.contentTop + geometry.areaOffset + geometry.rowTops[model.selected] - shown.scroll + geometry.rowHeights[model.selected] / 2;
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
        placeText(selectedTextLayer, { x: shown.geometry.listX, y: selectedCenterY() - height / 2, width, height });
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
        const afterBottom = geometry.rowTops[after] + geometry.rowHeights[after];
        if (geometry.rowTops[before] < scroll) scroll = geometry.rowTops[before];
        if (afterBottom > scroll + geometry.areaHeight) scroll = afterBottom - geometry.areaHeight;
        shown.scroll = Math.max(0, Math.min(Math.max(0, geometry.rowsHeight - geometry.areaHeight), scroll));
    }

    // Returns how long each part took, in ms, for the log. covering: an
    // opaque backdrop, shown at once, over a native menu kept open.
    function open(id, model, onClose, { fadeIn, covering }) {
        const timings = {};
        let partStartMs = host.now().getTime();
        const lap = name => {
            const nowMs = host.now().getTime();
            timings[name] = nowMs - partStartMs;
            partStartMs = nowMs;
        };
        for (const sound of Object.values(sounds)) sound.load();
        lap("sounds");
        measure(covering);
        lap("measure");
        // PinballY tells no script of a new window size: only this measure
        // sees it, so the images drawn for the old size are drawn again here.
        for (const record of images) if (record.signature !== windowSignature()) drawImage(record);
        lap("images");
        shown = { id, model, onClose, geometry: null, scroll: 0, layers: [], fadeTimer: null, glideTimer: null, fadeStartMs: 0, glideLastMs: 0, glideY: 0 };
        shown.geometry = computeGeometry(windowSize, model, wrappedHeightAt);
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
            ...placeStack(panel, geometry.panel),
            textsLayer, outline.layer, selectedTextLayer,
            ...placeStack(glass, geometry.panel),
        ];
        // Fading in, the cover would let the native menu show through.
        if (covering) backdrop.alpha = 1;
        else shown.layers.unshift(backdrop);
        if (!fadeIn) {
            setAlpha(1);
            return timings;
        }
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
        closedListeners.tell();
    }

    function close() {
        reportClosed(takeDown());
    }

    // Draws the menu; false, with the error logged and nothing left
    // drawn, when it cannot, or when it has no entry to choose.
    // onBack: what Exit and a MenuReturn entry run instead of only closing
    // (a submenu going back to its menu); selectedCmd: the entry the cursor
    // opens on, over the one PinballY marks; footer: { label, name } under
    // the list; keepNative: { exitCmd } over a native menu left open (never
    // cancelled), hidden by an opaque cover: Exit and a MenuReturn entry run
    // exitCmd, and the menu closes on that native menu's "menuclose".
    function draw(id, items, { dialogStyle = false, onClose = null, onBack = null, selectedCmd = null, footer = null, keepNative = null } = {}) {
        const startMs = host.now().getTime();
        // PinballY opening the kept native menu again over itself (the pause
        // menu opens twice in a row): no redraw, the cursor kept.
        if (keepNative && shown && shown.keepNative && shown.id === id) {
            shown.nativeOpenings++;
            return true;
        }
        // The same menu shown again over itself (PinballY refreshing it after
        // a stayOpen entry, as when ticking a category): no fade, and the
        // cursor stays on its entry unless PinballY marks one.
        const refreshedCmd = shown && shown.id === id ? shown.model.rows[shown.model.selected].cmd : null;
        close();
        try {
            const model = buildMenuModel(items, { dialogStyle, pagingCommands, footer });
            if (!model) return false;
            const kept = model.entries.find(index => model.rows[index].cmd === refreshedCmd);
            if (kept !== undefined && !model.entries.some(index => model.rows[index].selected)) model.selected = kept;
            const chosen = model.entries.find(index => model.rows[index].cmd === selectedCmd);
            if (selectedCmd !== null && chosen !== undefined) model.selected = chosen;
            const timings = open(id, model, safeHandler(SCRIPT_NAME, onClose || (() => {})), { fadeIn: refreshedCmd === null, covering: Boolean(keepNative) });
            shown.onBack = onBack;
            shown.keepNative = keepNative;
            // The native menu's openings not closed yet; the panel hidden
            // once a command ran, the cover left until the last one closes.
            shown.nativeOpenings = 1;
            shown.panelHidden = false;
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

    // Closes the menu for the one it goes back to; the close is reported
    // after, as for a command.
    function goBack() {
        const { onBack } = shown;
        const onClose = takeDown();
        try {
            onBack();
        } finally {
            reportClosed(onClose);
        }
    }

    // Over a native menu kept open: the panel hides at once, but the cover
    // stays and every press stays swallowed until its "menuclose".
    function hidePanel() {
        stopTimers();
        for (const layer of allLayers) if (layer !== backdrop) hide(layer);
        shown.panelHidden = true;
    }

    // The close is reported after the command, as PinballY's "menuclose"
    // follows its "command"; even when the command fails, for a wheel
    // dialog's queue not to stay held.
    function choose() {
        const row = shown.model.rows[shown.model.selected];
        sounds.select.play();
        if (shown.onBack && row.cmd === menuReturnCommand) {
            goBack();
            return;
        }
        if (shown.keepNative && !row.stayOpen) {
            const cmd = row.cmd === menuReturnCommand ? shown.keepNative.exitCmd : row.cmd;
            hidePanel();
            host.runCommand(cmd);
            return;
        }
        const onClose = row.stayOpen ? null : takeDown();
        try {
            host.runCommand(row.cmd);
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
        if (shown.panelHidden) return;
        if (ev.command === "Next") move(1);
        else if (ev.command === "Prev") move(-1);
        else if (ev.command === "NextPage") movePage(1);
        else if (ev.command === "PrevPage") movePage(-1);
        else if (ev.command === "Select" || ev.command === "Launch") choose();
        else if (ev.command === "Exit") {
            sounds.deselect.play();
            if (shown.onBack) goBack();
            else if (shown.keepNative) exitOverNative();
            else close();
        }
    }));

    // PinballY fires one press event per command mapped to the button (Exit
    // and ExitGame): run later, the command closing the native menu at once
    // still leaves the menu open, swallowing the press's other events.
    function exitOverNative() {
        const { exitCmd } = shown.keepNative;
        hidePanel();
        host.setTimeout(safeHandler(SCRIPT_NAME, () => host.runCommand(exitCmd)), 0);
    }

    // Fires after any menu closes; the native menu kept open closes ours,
    // whatever closed it, once each of its openings has closed.
    host.on("menuclose", safeHandler(SCRIPT_NAME, ev => {
        if (!shown || !shown.keepNative || ev.id !== shown.id) return;
        shown.nativeOpenings--;
        if (shown.nativeOpenings <= 0) close();
    }));

    // Fires once a game is over: PinballY may leave the native menu kept
    // open, with fewer "menuclose" than openings and nothing left to
    // resume, so ours comes down instead of covering the screen for good.
    host.on("postlaunch", safeHandler(SCRIPT_NAME, () => {
        if (shown && shown.keepNative) close();
    }));

    // Fires on a press PinballY hears in the background: another window
    // took the focus from the native menu kept open, and ours hears nothing.
    host.on("commandbuttonbgdown", safeHandler(SCRIPT_NAME, ev => {
        if (!shown || !shown.keepNative) return;
        host.log(`[${SCRIPT_NAME}] "${ev.command}" pressed in the background while the "${shown.id}" menu is open: another window has the focus.`);
    }));

    // Fires when the cabinet sits idle: the menu closes without choosing.
    host.on("attractmodestart", safeHandler(SCRIPT_NAME, close));

    // onClosed: a Drawn Menu never changes the UI mode, so no "wheelmode"
    // follows its closing.
    return { show, draw, close, isOpen: () => shown !== null, onClosed: closedListeners.onClosed };
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
