// ============================================================
// In-memory fake PinballY host for the node tests. Offers the same
// interface as common/pinbally_host.js, plus controls for the tests: set
// the date (a manual clock that also runs the host's timers), the monitor
// count, the table list, the wheel selection (and its filter, and the
// player's wheel moves) and the
// layout size, seed settings, fire PinballY events (the settings' own
// included), apply the metafilters
// to the wheel selection and a filter's games, enter and leave attract
// mode, open the Exit menu
// or main menu with their native items, pick menu items, play launched games, and inspect shown menus, launches, written settings keys,
// drawing layers, what was drawn, running intervals, sounds played (and on which player), the
// backglass window shown or hidden, and the lower status line (which can
// start with the player's own messages, and get a temporary one as
// PinballY's show() puts it); script filters are shown with selectFilter().
// Its in-memory file system is seeded with files and folders (and
// unreadable images) and inspected (file contents, reads, writes, renames
// and deletes).
// installGlobals() also exposes it as PinballY's globals (and the global
// Date and timers, and the COM file objects over the same file system), so
// code not yet on the host runs too. settle() waits on a real timer for
// the deferred work to run.
// Never loaded by PinballY.
// ============================================================

import { projectFolderOf } from "../common/pinbally_host.js";

const RealDate = Date;
const realSetTimeout = setTimeout;
const realClearTimeout = clearTimeout;

// Lets the zero-delay timers (deferred checks, dialogs) run for real.
export const settle = () => new Promise(resolve => realSetTimeout(resolve, 10));

// PinballY's own commands used by the add-ons; custom ones start above them.
const BUILT_IN_COMMANDS = {
    PlayGame: 1, ShowGameSetupMenu: 2, RateGame: 3, MenuReturn: 4, MenuPageUp: 5, MenuPageDown: 6, Quit: 7,
    ShowMainMenu: 8, ShowOperatorMenu: 9, PowerOff: 10, GameInfo: 11, Flyer: 12, HighScores: 13,
    Instructions: 14, AddFavorite: 15, Help: 16, AboutBox: 17,
};
// The [Top] filters' commands in the native main menu (any ids below the custom ones).
const ALL_TABLES_FILTER_CMD = 900;
const FAVORITES_FILTER_CMD = 901;
const FIRST_CUSTOM_COMMAND = 1000;

const TRUE_STRINGS = ["1", "true", "yes", "on"];

// Rough text metrics for the fake StyledText: fixed-width characters and lines.
const CHAR_WIDTH = 7;
const LINE_HEIGHT = 20;

// PinballY stores every setting as a string and converts on read.
function toStoredString(value) {
    if (typeof value === "boolean") return value ? "1" : "0";
    return String(value);
}

const withoutTrailingSlash = path => path.replace(/\\+$/, "");
const parentFolder = path => path.slice(0, path.lastIndexOf("\\"));

// Records its runs and gives a plausible measure; drawing it writes each
// run's text (without its line break) to the drawing context, where the
// fake layer records it. Like PinballY, measuring it with no text logs a
// layout error and gives 0 by 0, and so does a style whose size or weight
// is given but isn't a usable number (an undefined weight included):
// DirectWrite's CreateTextFormat rejects it.
const LAYOUT_ERROR = "Error creating styled text layout (CreateTextFormat, HRESULT=80070057)";

const isInvalidTextStyle = style => Boolean(style) && (
    ("size" in style && !(Number.isFinite(style.size) && style.size > 0))
    || ("weight" in style && !(Number.isFinite(style.weight) && style.weight >= 1 && style.weight <= 999)));

class FakeStyledText {
    constructor(options = {}, log = () => {}) {
        this.options = options;
        this.runs = [];
        this.log = log;
        this.invalidStyle = isInvalidTextStyle(options.textStyle);
    }

    add(run) {
        if (typeof run !== "string" && isInvalidTextStyle(run)) this.invalidStyle = true;
        this.runs.push(typeof run === "string" ? { text: run } : run);
    }

    text() {
        return this.runs.map(run => run.text).join("");
    }

    measure(width) {
        if (this.runs.length === 0 || this.invalidStyle) {
            this.log(LAYOUT_ERROR);
            return { width: 0, height: 0 };
        }
        const lines = this.text().split("\n");
        const lineCount = lines.reduce(
            (count, line) => count + Math.max(1, Math.ceil(line.length * CHAR_WIDTH / width)), 0);
        const longest = Math.max(...lines.map(line => line.length));
        return { width: Math.min(width, longest * CHAR_WIDTH), height: lineCount * LINE_HEIGHT };
    }

    draw(dc, rect) {
        for (const run of this.runs) dc.drawText(run.text.replace(/\n$/, ""), rect);
    }
}

export function createFakePinballYHost({
    now = new RealDate(),
    tables = [],
    layoutSize = { width: 1920, height: 1080 },
    programFolder = "C:\\PinballY\\",
    // The player's own messages, from PinballY's status line options.
    upperStatusLineMessages = [],
    lowerStatusLineMessages = [],
    // The monitors Windows reports: a cabinet has one per screen.
    monitorCount = 2,
} = {}) {
    let nowMs = now.getTime();
    let currentLayoutSize = { ...layoutSize };
    const layers = [];
    // Every layer draw, in order: { zIndex, texts, images }.
    const drawingList = [];
    // Every sound played, in order: { filePath, playerId }.
    const sounds = [];
    // Each Windows Media Player gets the next id when created.
    let nextSoundPlayerId = 1;
    // The single player behind playSound(), created on its first sound.
    let oneOffSoundPlayerId = null;
    // In-memory file system: folder paths, and file contents by path. The
    // program folder, its Scripts folder and the pack's folder exist, as in PinballY.
    const folders = new Set();
    const files = new Map();
    // Files another program holds open: writing, renaming or deleting them throws.
    const lockedFiles = new Set();
    // Image files that exist but cannot be decoded (broken or half-written).
    const unreadableImages = new Set();
    // Every write, rename and delete, in order: { operation, path, to? }.
    const fileOperationList = [];
    // Every file read, in order, by path.
    const fileReadList = [];
    addFolder(projectFolderOf(programFolder));
    // Pending timers, run in due order by advanceTime(): { id, dueMs, callback, intervalMs }.
    let timers = [];
    let nextTimerId = 1;
    // A table's wheel logo is its "wheelImage" path, when that file exists.
    // PinballY's resolveMedia is left out of the table's own keys, so tests
    // still compare tables with their plain description.
    const wheelImageOf = game => (game.wheelImage && files.has(game.wheelImage) ? game.wheelImage : null);
    const withMedia = table => Object.defineProperty({ ...table }, "resolveMedia", {
        value: (type) => {
            const found = type === "wheel image" ? wheelImageOf(table) : null;
            return found ? [found] : [];
        },
    });
    let allTables = tables.map(withMedia);
    // null = the wheel shows every visible table, in collection order.
    let wheelConfigIds = null;
    // Script filters by full id ("User.<id>"), and the id of the one shown.
    const filters = new Map();
    let currentFilterId = "All";
    // Metafilters by id, and the tables they ruled out the last time a
    // filter ran: like PinballY, select() is not called again until then.
    const metaFilters = new Map();
    let nextMetaFilterId = 1;
    let ruledOutConfigIds = new Set();
    // The status lines' entries, as PinballY's getText() gives them.
    const upperStatusLine = upperStatusLineMessages.map(text => ({ text, isTemp: false }));
    const lowerStatusLine = lowerStatusLineMessages.map(text => ({ text, isTemp: false }));
    const storedSettings = new Map();
    const writtenKeys = new Set();
    const handlers = new Map();
    const commandIds = new Map();
    let nextCommandId = FIRST_CUSTOM_COMMAND;
    const shownMenuList = [];
    let shownMenu = null;
    let uiMode = "wheel";
    // "starting", "running" or "exiting" while a game is on, as in PinballY.
    let runMode;
    const launchList = [];
    const logLines = [];
    const executedCommands = [];
    // Every showWindow() call on the backglass window, in order.
    const backglassShowCalls = [];

    function readSetting(key, defaultValue, convert) {
        return storedSettings.has(key) ? convert(storedSettings.get(key)) : defaultValue;
    }

    const settings = {
        getString: (key, defaultValue) => readSetting(key, defaultValue, text => text),
        getInt: (key, defaultValue) => readSetting(key, defaultValue, text => parseInt(text, 10)),
        getFloat: (key, defaultValue) => readSetting(key, defaultValue, text => parseFloat(text)),
        getBool: (key, defaultValue) =>
            readSetting(key, defaultValue, text => TRUE_STRINGS.includes(text.toLowerCase())),
        set: (key, value) => {
            storedSettings.set(key, toStoredString(value));
            writtenKeys.add(key);
        },
    };

    // PinballY accepts "event.Namespace" names; only the event part matters here.
    function on(eventName, handler) {
        const type = eventName.split(".")[0];
        if (!handlers.has(type)) handlers.set(type, []);
        handlers.get(type).push(handler);
    }

    // As PinballY does, inserts a temporary entry just after the current one
    // (always the first here) and after the temporary ones already queued there.
    function showOnStatusLine(statusLine, text) {
        let index = 1;
        while (index < statusLine.length && statusLine[index].isTemp) index++;
        statusLine.splice(index, 0, { text, isTemp: true });
    }
    const showOnUpperStatusLine = text => showOnStatusLine(upperStatusLine, text);
    const showOnLowerStatusLine = text => showOnStatusLine(lowerStatusLine, text);

    // PinballY's statusLines.upper / .lower object for one line.
    function statusLineObject(statusLine) {
        return {
            getText: () => statusLine.map(entry => ({ ...entry })),
            add: (text) => { statusLine.push({ text, isTemp: false }); },
            setText: (index, text) => { statusLine[index].text = text; },
            show: text => showOnStatusLine(statusLine, text),
        };
    }

    function fire(type, properties = {}) {
        const ev = {
            type,
            defaultPrevented: false,
            preventDefault() { this.defaultPrevented = true; },
        };
        // Copies accessors as accessors, so a menu's items stay live.
        Object.defineProperties(ev, Object.getOwnPropertyDescriptors(properties));
        for (const handler of [...(handlers.get(type) || [])]) handler(ev);
        return ev;
    }

    function returnToWheel() {
        uiMode = "wheel";
        runMode = undefined;
        fire("wheelmode");
    }

    function getFullUIMode() {
        const mode = { mode: uiMode };
        if (shownMenu) mode.menuID = shownMenu.id;
        if (runMode) mode.runMode = runMode;
        return mode;
    }

    function addTimer(callback, ms, intervalMs) {
        // A zero interval would never let advanceTime() reach its target.
        if (intervalMs !== undefined && !(intervalMs > 0)) {
            throw new Error(`The fake host needs a positive interval, not ${intervalMs} ms.`);
        }
        const id = nextTimerId++;
        timers.push({ id, dueMs: nowMs + ms, callback, intervalMs });
        return id;
    }

    function removeTimer(id) {
        timers = timers.filter(timer => timer.id !== id);
    }

    // Moves the clock forward, running every timer that falls due on the way
    // at its own due time, earliest first (creation order on a tie).
    function advanceTime(ms) {
        const targetMs = nowMs + ms;
        for (;;) {
            const due = timers
                .filter(timer => timer.dueMs <= targetMs)
                .sort((a, b) => a.dueMs - b.dueMs || a.id - b.id)[0];
            if (!due) break;
            nowMs = due.dueMs;
            if (due.intervalMs === undefined) removeTimer(due.id);
            else due.dueMs += due.intervalMs;
            due.callback();
        }
        nowMs = targetMs;
    }

    // A drawing layer that keeps only what the tests look at: the texts,
    // image paths, frames (frameRect) and fill colours (fillRect) drawn
    // since the last draw or clear, the fills and texts in their drawing
    // order, the canvas size of the last draw, its position, scale and
    // alpha. Like PinballY, a draw without a size gets a canvas the size of
    // the window.
    function createDrawingLayer(zIndex) {
        let texts = [];
        let images = [];
        let frames = [];
        let strokes = [];
        let canvasSize = null;
        let position = { x: 0, y: 0 };
        // PinballY's default: stretched to the whole window.
        let scale = { xSpan: 1, ySpan: 1 };
        const dc = {
            getSize: () => ({ ...canvasSize }),
            fillRect: (x, y, width, height, color) => { strokes.push({ fill: color, rect: { x, y, width, height } }); },
            frameRect: (x, y, width, height) => { frames.push({ x, y, width, height }); },
            drawImage: (path) => { images.push(path); },
            // Like PinballY: throws on a missing or unreadable image.
            getImageSize: (path) => {
                if (!isImageReadable(path)) throw new Error(`Cannot load image: ${path}`);
                return { width: 256, height: 256 };
            },
            drawText: (text, rect) => {
                texts.push(text);
                strokes.push({ text, rect: rect && { ...rect } });
            },
        };
        const layer = {
            zIndex,
            alpha: 1,
            draw(drawFunction, width, height) {
                texts = [];
                images = [];
                frames = [];
                strokes = [];
                canvasSize = width === undefined ? { ...currentLayoutSize } : { width, height };
                drawFunction(dc);
                drawingList.push({ zIndex, texts: [...texts], images: [...images] });
            },
            clear() {
                texts = [];
                images = [];
                frames = [];
                strokes = [];
            },
            setPos(x, y, align) { position = align === undefined ? { x, y } : { x, y, align }; },
            setScale(options) { scale = { ...options }; },
            texts: () => [...texts],
            images: () => [...images],
            frames: () => frames.map(frame => ({ ...frame })),
            fills: () => strokes.filter(stroke => "fill" in stroke).map(stroke => stroke.fill),
            // Fills ({ fill: color, rect }) and texts ({ text, rect }) in drawing order.
            strokes: () => strokes.map(stroke => ({ ...stroke })),
            canvasSize: () => ({ ...canvasSize }),
            position: () => ({ ...position }),
            scale: () => ({ ...scale }),
        };
        layers.push(layer);
        return layer;
    }

    function removeDrawingLayer(layer) {
        const index = layers.indexOf(layer);
        if (index >= 0) layers.splice(index, 1);
    }

    const isImageReadable = path => files.has(path) && !unreadableImages.has(path);

    // Like the production host: a file never added by addFile() is missing,
    // and a single player plays every sound.
    function requireSoundFile(filePath) {
        if (!files.has(filePath)) throw new Error(`Sound file not found: ${filePath}`);
    }

    function playSound(filePath) {
        requireSoundFile(filePath);
        if (oneOffSoundPlayerId === null) oneOffSoundPlayerId = nextSoundPlayerId++;
        sounds.push({ filePath, playerId: oneOffSoundPlayerId });
    }

    function createSoundRotation(filePath, playerCount) {
        requireSoundFile(filePath);
        const playerIds = Array.from({ length: playerCount }, () => nextSoundPlayerId++);
        let next = 0;
        return {
            play() {
                sounds.push({ filePath, playerId: playerIds[next] });
                next = (next + 1) % playerIds.length;
            },
        };
    }

    // A Windows Media Player COM object: it plays its URL when set with
    // autoStart on, or on controls.play(); a missing file plays nothing,
    // without an error, as in Windows.
    function createComMediaPlayer() {
        const playerId = nextSoundPlayerId++;
        let url = "";
        const playUrl = () => {
            if (files.has(url)) sounds.push({ filePath: url, playerId });
        };
        const player = {
            settings: { autoStart: true },
            get URL() { return url; },
            set URL(filePath) {
                url = filePath;
                if (player.settings.autoStart) playUrl();
            },
            controls: { currentPosition: 0, play: playUrl },
        };
        return player;
    }

    // Creates the folder and every missing parent folder.
    function addFolder(folderPath) {
        for (let path = withoutTrailingSlash(folderPath); path.includes("\\"); path = parentFolder(path)) {
            folders.add(path);
        }
    }

    function requireParentFolder(path) {
        if (!folders.has(parentFolder(path))) throw new Error(`Folder not found: ${parentFolder(path)}`);
    }

    function requireFile(path) {
        if (!files.has(path)) throw new Error(`File not found: ${path}`);
    }

    function requireUnlocked(path) {
        if (lockedFiles.has(path)) throw new Error(`Permission denied: ${path}`);
    }

    // Same rules as Scripting.FileSystemObject and ADODB.Stream: writing
    // needs the folder, renaming never overwrites, a missing file throws.
    const fileSystem = {
        listFolders(folderPath) {
            const parent = withoutTrailingSlash(folderPath);
            return [...folders].filter(path => parentFolder(path) === parent).map(path => path.slice(parent.length + 1));
        },
        listFiles(folderPath) {
            const parent = withoutTrailingSlash(folderPath);
            return [...files.keys()].filter(path => parentFolder(path) === parent).map(path => path.slice(parent.length + 1));
        },
        fileExists: (path) => files.has(path),
        readText(path) {
            requireFile(path);
            fileReadList.push(path);
            return files.get(path);
        },
        writeText(path, text) {
            requireParentFolder(path);
            requireUnlocked(path);
            files.set(path, text);
            fileOperationList.push({ operation: "write", path });
        },
        renameFile(fromPath, toPath) {
            requireFile(fromPath);
            requireUnlocked(fromPath);
            requireParentFolder(toPath);
            if (files.has(toPath)) throw new Error(`File already exists: ${toPath}`);
            files.set(toPath, files.get(fromPath));
            files.delete(fromPath);
            fileOperationList.push({ operation: "rename", path: fromPath, to: toPath });
        },
        deleteFile(path) {
            requireFile(path);
            requireUnlocked(path);
            files.delete(path);
            fileOperationList.push({ operation: "delete", path });
        },
        createFolder(folderPath) {
            requireParentFolder(withoutTrailingSlash(folderPath));
            folders.add(withoutTrailingSlash(folderPath));
        },
        isImageReadable,
    };

    // Scripting.FileSystemObject over the in-memory file system, for code
    // that uses the COM object directly (the production host, config.js).
    function createComFileSystem() {
        return {
            FileExists: fileSystem.fileExists,
            FolderExists: (path) => folders.has(withoutTrailingSlash(path)),
            GetFolder: (path) => {
                if (!folders.has(withoutTrailingSlash(path))) throw new Error(`Folder not found: ${path}`);
                return {
                    SubFolders: fileSystem.listFolders(path).map(name => ({ Name: name })),
                    Files: fileSystem.listFiles(path).map(name => ({ Name: name })),
                };
            },
            CreateFolder: (path) => {
                if (folders.has(withoutTrailingSlash(path))) throw new Error(`Folder already exists: ${path}`);
                fileSystem.createFolder(path);
            },
            MoveFile: fileSystem.renameFile,
            DeleteFile: fileSystem.deleteFile,
        };
    }

    // ADODB.Stream in text mode: only what reading and writing a whole
    // UTF-8 file needs.
    function createComTextStream() {
        let text = "";
        return {
            Type: 0,
            Charset: "",
            Open() { text = ""; },
            LoadFromFile(path) { text = fileSystem.readText(path); },
            ReadText: () => text,
            WriteText(newText) { text += newText; },
            SaveToFile(path) { fileSystem.writeText(path, text); },
            Close() {},
        };
    }

    function showMenu(id, items, options = {}) {
        shownMenu = { id, items: [...items], options };
        shownMenuList.push(shownMenu);
        uiMode = "menu";
    }

    function getGameInfo(configId) {
        return allTables.find(table => table.configId === configId || table.id === configId) || null;
    }

    function getBuiltInCommand(name) {
        if (!(name in BUILT_IN_COMMANDS)) throw new Error(`The fake host has no built-in command "${name}".`);
        return BUILT_IN_COMMANDS[name];
    }

    // PinballY's wheel never shows hidden or unconfigured tables.
    const canBeOnWheel = game => !game.isHidden && game.isConfigured !== false;

    // Runs the metafilters over every table, in ascending priority. Narrowing
    // metafilters only: a table stays when every one keeps it, which is what
    // PinballY's "the last one called decides" gives when none widens.
    function runMetaFilters() {
        const ordered = [...metaFilters.values()].sort((a, b) => (a.priority || 0) - (b.priority || 0));
        for (const metaFilter of ordered) if (metaFilter.before) metaFilter.before();
        ruledOutConfigIds = new Set(allTables
            .filter(game => !ordered.every(metaFilter => metaFilter.select(game, true)))
            .map(game => game.configId));
        for (const metaFilter of ordered) if (metaFilter.after) metaFilter.after();
    }

    // The wheel selection before the metafilters, in wheel order.
    const unfilteredWheel = () => (wheelConfigIds === null
        ? host.getVisibleTables().map(game => game.configId)
        : wheelConfigIds);

    // Runs the filter like PinballY: before(), then select() over the
    // visible, configured tables, sorted with compareForSort(); the wheel
    // then shows them from the first one.
    function applyFilter(filterId) {
        const filter = filters.get(filterId);
        if (!filter) throw new Error(`The fake host has no filter "${filterId}".`);
        currentFilterId = filterId;
        if (filter.before) filter.before();
        const selected = allTables
            .filter(game => canBeOnWheel(game) && filter.select(game));
        if (filter.compareForSort) selected.sort(filter.compareForSort);
        if (filter.after) filter.after();
        wheelConfigIds = selected.map(game => game.configId);
        runMetaFilters();
    }

    // Like gameList.setCurFilter(): "All" shows every visible, configured
    // table in collection order, a script filter runs; the current table
    // stays current when the new filter keeps it.
    function setCurrentFilter(filterId) {
        const [current] = host.getWheelTables();
        if (filterId === "All") {
            currentFilterId = filterId;
            wheelConfigIds = allTables
                .filter(canBeOnWheel)
                .map(game => game.configId);
            runMetaFilters();
        } else {
            applyFilter(filterId);
        }
        const currentIndex = current ? host.getWheelTables().findIndex(game => game.configId === current.configId) : -1;
        if (currentIndex > 0) setWheelGame(currentIndex);
    }

    // Like gameList.createFilter(): kept under its full id, never shown until selected.
    function createFilter(filter) {
        filters.set(`User.${filter.id}`, filter);
        return allocateCommand(`filter ${filter.id}`);
    }

    // A script filter runs again from its first table; any other filter
    // keeps its selection, and only the metafilters run again: a table they
    // now rule out leaves the wheel, the next one becoming current.
    function refreshFilter() {
        if (filters.has(currentFilterId)) applyFilter(currentFilterId);
        else runMetaFilters();
    }

    // Like gameList.createMetaFilter(): in effect at once. Narrowing only.
    function createMetaFilter(metaFilter) {
        if (metaFilter.includeExcluded) throw new Error("The fake host has no widening metafilters.");
        const id = nextMetaFilterId++;
        metaFilters.set(id, metaFilter);
        runMetaFilters();
        return id;
    }

    // Like gameList.setWheelGame(): the table at this offset from the current
    // one becomes the current one; the wheel wraps around. The tables the
    // metafilters rule out keep their place, for when they come back.
    function setWheelGame(offset) {
        const shown = host.getWheelTables();
        if (shown.length === 0) return;
        const target = shown[((offset % shown.length) + shown.length) % shown.length].configId;
        const configIds = unfilteredWheel();
        const start = configIds.indexOf(target);
        wheelConfigIds = [...configIds.slice(start), ...configIds.slice(0, start)];
    }

    function allocateCommand(name) {
        const id = nextCommandId++;
        commandIds.set(name, id);
        return id;
    }

    const host = {
        settings,
        now: () => new RealDate(nowMs),
        setTimeout: (callback, ms) => addTimer(callback, ms),
        clearTimeout: removeTimer,
        setInterval: (callback, ms) => addTimer(callback, ms, ms),
        clearInterval: removeTimer,
        getVisibleTables: () => allTables.filter(table => !table.isHidden),
        getWheelTables: () => unfilteredWheel()
            .filter(configId => !ruledOutConfigIds.has(configId))
            .map(getGameInfo),
        getCurrentTable: () => host.getWheelTables()[0] || null,
        getGameInfo,
        getWheelImage: wheelImageOf,
        setCurrentFilter,
        createFilter,
        getCurrentFilterId: () => currentFilterId,
        refreshFilter,
        createMetaFilter,
        setWheelGame,
        getUIMode: () => uiMode,
        getFullUIMode,
        showMenu,
        on,
        onGameListEvent: on,
        onSettingsEvent: on,
        createDrawingLayer,
        removeDrawingLayer,
        createStyledText: (options) => new FakeStyledText(options, (text) => { logLines.push(text); }),
        allocateCommand,
        getBuiltInCommand,
        doCommand: (id) => { executedCommands.push(id); },
        // PinballY leaves the wheel as soon as a launch starts.
        playGame: (game) => {
            launchList.push(game);
            uiMode = "running";
            runMode = "starting";
        },
        getProgramFolder: () => programFolder,
        getProjectFolder: () => projectFolderOf(programFolder),
        countMonitors: () => monitorCount,
        showBackglass: (visible) => { backglassShowCalls.push(visible); },
        playSound,
        createSoundRotation,
        files: fileSystem,
        log: (text) => { logLines.push(text); },

        // Moves the date without running the timers.
        setNow(date) { nowMs = date.getTime(); },
        advanceTime,
        // Intervals still running (a frame timer left on keeps redrawing).
        runningIntervalCount: () => timers.filter(timer => timer.intervalMs !== undefined).length,
        setLayoutSize(size) { currentLayoutSize = { ...size }; },
        drawingLayers: () => [...layers],
        drawings: () => drawingList.map(drawing => ({ ...drawing, texts: [...drawing.texts], images: [...drawing.images] })),
        soundsPlayed: () => sounds.map(sound => sound.filePath),
        // The id of the player each sound played on, in the same order.
        soundPlayers: () => sounds.map(sound => sound.playerId),
        // Seeds a file (and its folders) without recording a write.
        addFile(filePath, content = "") {
            addFolder(parentFolder(filePath));
            files.set(filePath, content);
        },
        // Seeds an image file that exists but cannot be decoded.
        addUnreadableImage(filePath) {
            host.addFile(filePath, "not an image");
            unreadableImages.add(filePath);
        },
        // Locks a file as another program holding it open would.
        lockFile(filePath) { lockedFiles.add(filePath); },
        unlockFile(filePath) { lockedFiles.delete(filePath); },
        addFolder,
        // Removes the folder with everything in it, as a player would by hand.
        removeFolder(folderPath) {
            const folder = withoutTrailingSlash(folderPath);
            const isInside = path => path === folder || path.startsWith(`${folder}\\`);
            for (const path of [...folders]) if (isInside(path)) folders.delete(path);
            for (const path of [...files.keys()]) if (isInside(path)) files.delete(path);
        },
        // The file's text, or undefined when it doesn't exist.
        readFile: (filePath) => files.get(filePath),
        fileOperations: () => fileOperationList.map(operation => ({ ...operation })),
        fileReads: () => [...fileReadList],
        setTables(newTables) { allTables = newTables.map(withMedia); },
        // The current wheel selection, in wheel order (index 0 is the current
        // table), optionally under a filter id such as "Favorites".
        setWheelTables(configIds, { filterId = currentFilterId } = {}) {
            const unknown = configIds.filter(configId => !getGameInfo(configId));
            if (unknown.length > 0) throw new Error(`Unknown tables in the wheel: ${unknown.join(", ")}`);
            wheelConfigIds = [...configIds];
            currentFilterId = filterId;
            runMetaFilters();
        },
        currentFilterId: () => currentFilterId,
        // The player moves the wheel by this offset (Next, Prev, Next Page...):
        // unlike setWheelGame(), PinballY fires "gameselect" with the new table.
        moveWheel(offset) {
            setWheelGame(offset);
            fire("gameselect", { game: host.getWheelTables()[0] || null });
        },
        // Shows a script filter, by its full id ("User.<id>").
        selectFilter: applyFilter,
        // The script filters' descriptions, as created.
        scriptFilters: () => [...filters.values()],
        upperStatusLine: () => upperStatusLine.map(entry => entry.text),
        lowerStatusLine: () => lowerStatusLine.map(entry => entry.text),
        showOnUpperStatusLine,
        showOnLowerStatusLine,
        seedSettings(values) {
            for (const [key, value] of Object.entries(values)) storedSettings.set(key, toStoredString(value));
        },
        storedSettings: () => Object.fromEntries(storedSettings),
        writtenSettingsKeys: () => new Set(writtenKeys),
        commandId: (name) => commandIds.get(name),
        fire,

        shownMenus: () => [...shownMenuList],
        currentMenu: () => shownMenu,

        // A menu opened by the player (unlike showMenu, which doesn't fire
        // "menuopen"): handlers may add items, or delete them by command id
        // then tidy the separators, before it is shown.
        openMenu(id, items) {
            let menuItems = [...items];
            const ev = fire("menuopen", {
                id,
                get items() { return menuItems; },
                set items(newItems) { menuItems = newItems; },
                // Like PinballY: after a command id it does not find, at the end.
                addMenuItem(where, newItems) {
                    const toAdd = Array.isArray(newItems) ? newItems : [newItems];
                    const afterIndex = menuItems.findIndex(item => item.cmd === where.after);
                    menuItems.splice(afterIndex === -1 ? menuItems.length : afterIndex + 1, 0, ...toAdd);
                },
                deleteMenuItem(cmd) {
                    menuItems = menuItems.filter(item => item.cmd !== cmd);
                    this.menuUpdated = true;
                },
                // Like PinballY: each run of separators becomes a single
                // one, counting only those titled "" (an untitled one is not).
                tidyMenu() {
                    const isSeparator = item => item?.cmd < 0 && item.title === "";
                    menuItems = menuItems.filter((item, index) => !isSeparator(item) || !isSeparator(menuItems[index - 1]));
                    this.menuUpdated = true;
                },
            });
            if (!ev.defaultPrevented) showMenu(id, menuItems);
        },

        // The Exit menu as PinballY opens it on the Exit button, with its
        // native items; PinballY's own separators are titled "". Where Help
        // and About sit is not documented: to be checked on the cabinet.
        openExitMenu() {
            host.openMenu("exit", [
                { title: "Exit PinballY", cmd: BUILT_IN_COMMANDS.Quit },
                { title: "Shut Down", cmd: BUILT_IN_COMMANDS.PowerOff },
                { title: "", cmd: -1 },
                { title: "Operator Menu", cmd: BUILT_IN_COMMANDS.ShowOperatorMenu },
                { title: "", cmd: -1 },
                { title: "Help", cmd: BUILT_IN_COMMANDS.Help },
                { title: "About PinballY", cmd: BUILT_IN_COMMANDS.AboutBox },
                { title: "", cmd: -1 },
                { title: "Cancel", cmd: BUILT_IN_COMMANDS.MenuReturn },
            ]);
        },

        // The main menu as PinballY opens it, with its native items: "Play",
        // the information section, Rate Table / Add to Favorites, then the
        // [Top] filters. Its separators are not documented: to be checked on
        // the cabinet.
        openMainMenu() {
            host.openMenu("main", [
                { title: "Play", cmd: BUILT_IN_COMMANDS.PlayGame },
                { title: "Information", cmd: BUILT_IN_COMMANDS.GameInfo },
                { title: "Flyer", cmd: BUILT_IN_COMMANDS.Flyer },
                { title: "High Scores", cmd: BUILT_IN_COMMANDS.HighScores },
                { title: "Instruction Card", cmd: BUILT_IN_COMMANDS.Instructions },
                { title: "", cmd: -1 },
                { title: "Rate Table", cmd: BUILT_IN_COMMANDS.RateGame },
                { title: "Add to Favorites", cmd: BUILT_IN_COMMANDS.AddFavorite },
                { title: "", cmd: -1 },
                { title: "All Tables", cmd: ALL_TABLES_FILTER_CMD },
                { title: "Favorites", cmd: FAVORITES_FILTER_CMD },
            ]);
        },

        // Closes the current menu (as Escape would). Back to the wheel only if
        // no table was launched from the menu and no "menuclose" handler
        // opened another menu in the meantime.
        closeMenu() {
            if (!shownMenu) throw new Error("No menu is open.");
            const { id } = shownMenu;
            shownMenu = null;
            if (uiMode === "menu") uiMode = "wheel";
            fire("menuclose", { id });
            if (uiMode === "wheel") fire("wheelmode");
        },

        // Picks the item with this title in the current menu: fires its
        // command, then closes the menu, unless the item stays open. A menu
        // shown by the command replaces it: only its "menuclose" fires.
        selectMenuItem(title) {
            const menu = shownMenu;
            const item = menu && menu.items.find(menuItem => menuItem.title === title);
            if (!item) throw new Error(`No menu item titled "${title}" is showing.`);
            fire("command", { id: item.cmd });
            if (shownMenu !== menu) fire("menuclose", { id: menu.id });
            else if (!item.stayOpen) host.closeMenu();
        },

        // The cabinet enters attract mode after a while on its own: PinballY
        // then moves the wheel itself ("gameselect" outside wheel mode).
        enterAttractMode() {
            uiMode = "attract";
            fire("attractmodestart");
        },
        // A button press ends attract mode, back to the wheel.
        exitAttractMode() {
            fire("attractmodeend");
            returnToWheel();
        },

        launches: () => [...launchList],
        gameStarted(game) {
            uiMode = "running";
            runMode = "running";
            fire("gamestarted", { game });
        },
        gameOver(game) {
            runMode = "exiting";
            fire("gameover", { game });
            returnToWheel();
        },
        launchError(game) {
            runMode = "exiting";
            fire("launcherror", { game });
            returnToWheel();
        },

        logLines: () => [...logLines],
        executedCommands: () => [...executedCommands],
        backglassShowCalls: () => [...backglassShowCalls],

        // Exposes this fake as PinballY's globals; returns the function that
        // restores the previous globals.
        installGlobals() {
            const globalNames = [
                "optionSettings", "gameList", "mainWindow", "command", "logfile", "Date",
                "StyledText", "systemInfo", "createAutomationObject",
                "setTimeout", "clearTimeout", "setInterval", "clearInterval",
                "backglassWindow", "dllImport",
            ];
            const previous = globalNames.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]);

            class FakeDate extends RealDate {
                constructor(...args) {
                    if (args.length === 0) super(nowMs);
                    else super(...args);
                }
                static now() { return nowMs; }
            }

            Object.assign(globalThis, {
                optionSettings: {
                    get: settings.getString,
                    getInt: settings.getInt,
                    getFloat: settings.getFloat,
                    getBool: settings.getBool,
                    set: settings.set,
                    // "settingsreload", fired with fire() like the main window's events.
                    on,
                },
                gameList: {
                    getAllGames: () => [...allTables],
                    getAllWheelGames: () => host.getWheelTables(),
                    // "gameselect" and "filterselect", fired with fire() like the main window's events.
                    on,
                    getWheelGame: (offset) => host.getWheelTables()[offset] || null,
                    getWheelCount: () => host.getWheelTables().length,
                    createFilter,
                    getCurFilter: () => ({ id: currentFilterId }),
                    setCurFilter: setCurrentFilter,
                    setWheelGame: (offset) => { setWheelGame(offset); },
                    refreshFilter,
                    createMetaFilter,
                    getGameInfo,
                },
                mainWindow: {
                    on,
                    showMenu,
                    getUIMode: getFullUIMode,
                    playGame: host.playGame,
                    doCommand: host.doCommand,
                    createDrawingLayer,
                    removeDrawingLayer,
                    statusLines: {
                        upper: statusLineObject(upperStatusLine),
                        lower: statusLineObject(lowerStatusLine),
                    },
                },
                command: { ...BUILT_IN_COMMANDS, allocate: allocateCommand },
                logfile: { log: (text) => { logLines.push(text); } },
                Date: FakeDate,
                // Zero-delay timeouts stay on the real event loop, so the
                // add-ons' "next tick" deferrals still run on settle(); every
                // other timer waits for advanceTime().
                setTimeout: (callback, ms = 0) => (ms > 0 ? addTimer(callback, ms) : realSetTimeout(callback, 0)),
                clearTimeout: (id) => {
                    if (typeof id === "number") removeTimer(id);
                    else realClearTimeout(id);
                },
                setInterval: (callback, ms) => addTimer(callback, ms, ms),
                clearInterval: removeTimer,
                StyledText: FakeStyledText,
                systemInfo: { programDir: programFolder },
                backglassWindow: { showWindow: (visible) => { backglassShowCalls.push(visible); } },
                // Only User32's GetSystemMetrics, for the monitor count
                // (SM_CMONITORS); any other DLL throws.
                dllImport: {
                    bind: (dllName) => {
                        if (dllName.toLowerCase() !== "user32.dll") throw new Error(`The fake host has no DLL "${dllName}".`);
                        return { GetSystemMetrics: (index) => (index === 80 ? monitorCount : 0) };
                    },
                },
                // Only Windows Media Player, and the file objects over the
                // in-memory file system (no .env.local unless a test adds
                // one, so common/config.js imported after this keeps its
                // defaults). Any other COM object throws.
                createAutomationObject: (progId) => {
                    if (progId === "WMPlayer.OCX.7") return createComMediaPlayer();
                    if (progId === "Scripting.FileSystemObject") return createComFileSystem();
                    if (progId === "ADODB.Stream") return createComTextStream();
                    throw new Error(`The fake host has no COM object "${progId}".`);
                },
            });

            return function uninstallGlobals() {
                for (const [name, descriptor] of previous) {
                    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
                    else delete globalThis[name];
                }
            };
        },
    };

    return host;
}
