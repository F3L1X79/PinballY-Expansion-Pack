// ============================================================
// Production PinballY host: the single seam through which the deepened
// modules reach PinballY (settings, clock, timers, visible tables, wheel
// selection and its current table, wheel logos, global media and the
// underlay, filter and metafilters, game list and settings events, main
// window menus / UI mode / events / drawing layers,
// StyledText, commands and running them, table launch, program and pack folders,
// monitor count, backglass window, sound playback (one-off or on players
// in turn), logfile.log, and the few file operations the Profile store
// needs).
// Every call passes straight through to PinballY's globals; tests use the
// in-memory fake host from tests/support/fake_pinbally_host.js instead. No side
// effects on import.
// ============================================================

const ADODB_TEXT_TYPE = 2;
const ADODB_READ_ALL = -1;
const ADODB_SAVE_OVERWRITE = 2;
// Behind PinballY's own background layer (z 0), so the probe never shows.
const IMAGE_PROBE_Z_INDEX = -1000;
// GetSystemMetrics index: the number of display monitors on the desktop.
const SM_CMONITORS = 80;
// The pack's fixed folder under Scripts (ADR 0009): never detected at run time.
const PROJECT_FOLDER_NAME = "ExpansionPack";

// The id of PinballY's own "All Tables" filter.
export const ALL_TABLES_FILTER = "All";

// The pack's folder for a PinballY program folder, with no trailing backslash.
export const projectFolderOf = programFolder => `${programFolder.replace(/\\+$/, "")}\\Scripts\\${PROJECT_FOLDER_NAME}`;

// Text through ADODB.Stream, which encodes UTF-8 so accented names and paths
// survive (Scripting.FileSystemObject only knows ANSI and UTF-16).
function openUtf8Stream() {
    const stream = createAutomationObject("ADODB.Stream");
    stream.Type = ADODB_TEXT_TYPE;
    stream.Charset = "utf-8";
    stream.Open();
    return stream;
}

function createFileSystem() {
    let fileSystemObject = null;
    const fso = () => {
        if (!fileSystemObject) fileSystemObject = createAutomationObject("Scripting.FileSystemObject");
        return fileSystemObject;
    };

    return {
        // The names of the folder's sub-folders; none when it doesn't exist.
        listFolders: (folderPath) => {
            if (!fso().FolderExists(folderPath)) return [];
            const names = [];
            for (const folder of fso().GetFolder(folderPath).SubFolders) names.push(folder.Name);
            return names;
        },
        // The names of the folder's files; none when it doesn't exist.
        listFiles: (folderPath) => {
            if (!fso().FolderExists(folderPath)) return [];
            const names = [];
            for (const file of fso().GetFolder(folderPath).Files) names.push(file.Name);
            return names;
        },
        fileExists: (path) => fso().FileExists(path),
        readText: (path) => {
            const stream = openUtf8Stream();
            try {
                stream.LoadFromFile(path);
                // ADODB.Stream keeps the UTF-8 byte order mark it writes itself.
                return stream.ReadText(ADODB_READ_ALL).replace(/^\uFEFF/, "");
            } finally {
                stream.Close();
            }
        },
        writeText: (path, text) => {
            const stream = openUtf8Stream();
            try {
                stream.WriteText(text);
                stream.SaveToFile(path, ADODB_SAVE_OVERWRITE);
            } finally {
                stream.Close();
            }
        },
        // Throws when the target already exists.
        renameFile: (fromPath, toPath) => { fso().MoveFile(fromPath, toPath); },
        deleteFile: (path) => { fso().DeleteFile(path); },
        // Does nothing when the folder exists; its parent folder must exist.
        createFolder: (folderPath) => {
            if (!fso().FolderExists(folderPath)) fso().CreateFolder(folderPath);
        },
        // dc.getImageSize is the only check that decodes the image: it throws
        // on a missing or unreadable file, where drawImage draws nothing
        // without an error. It exists only inside a draw callback, so a
        // throwaway layer behind every other one provides it.
        isImageReadable: (path) => {
            const probe = mainWindow.createDrawingLayer(IMAGE_PROBE_Z_INDEX);
            try {
                let readable = false;
                probe.draw(dc => {
                    try {
                        dc.getImageSize(path);
                        readable = true;
                    } catch (error) {
                        // The answer itself: the caller logs the unreadable image.
                    }
                }, 1, 1);
                return readable;
            } finally {
                mainWindow.removeDrawingLayer(probe);
            }
        },
    };
}

// The sound rotations by file path, one set per PinballY session (its COM
// factory): every screen playing Next.wav shares the same players instead
// of creating its own.
const soundRotationsBySession = new WeakMap();

function requireSoundFile(filePath) {
    if (!createAutomationObject("Scripting.FileSystemObject").FileExists(filePath)) {
        throw new Error(`Sound file not found: ${filePath}`);
    }
}

export function createPinballYHost() {
    // Created on the first sound played: most sessions never play one.
    let mediaPlayer = null;
    // Bound on the first monitor count, then kept.
    let user32 = null;

    return {
        settings: {
            getString: (key, defaultValue) => optionSettings.get(key, defaultValue),
            getInt: (key, defaultValue) => optionSettings.getInt(key, defaultValue),
            getFloat: (key, defaultValue) => optionSettings.getFloat(key, defaultValue),
            getBool: (key, defaultValue) => optionSettings.getBool(key, defaultValue),
            set: (key, value) => { optionSettings.set(key, value); },
        },
        // The settings' own events, such as "settingsreload".
        onSettingsEvent: (eventName, handler) => { optionSettings.on(eventName, handler); },

        now: () => new Date(),
        setTimeout: (callback, ms) => setTimeout(callback, ms),
        clearTimeout: (id) => { clearTimeout(id); },
        setInterval: (callback, ms) => setInterval(callback, ms),
        clearInterval: (id) => { clearInterval(id); },

        getVisibleTables: () => gameList.getAllGames().filter(game => !game.isHidden),
        // The current wheel selection in wheel order: index 0 is the current table.
        getWheelTables: () => gameList.getAllWheelGames(),
        // The current table alone, without listing the whole selection; null
        // when the wheel selection is empty.
        getCurrentTable: () => gameList.getWheelGame(0) || null,
        getGameInfo: (configId) => gameList.getGameInfo(configId),
        // The table's wheel logo file, null when it has none.
        getWheelImage: (game) => {
            const found = game.resolveMedia("wheel image", true);
            return found && found.length > 0 ? found[0] : null;
        },
        // Doesn't fire "filterselect"; fires "gameselect" only when the
        // current table has to change.
        setCurrentFilter: (filterId) => { gameList.setCurFilter(filterId); },
        // PinballY prefixes the id with "User."; a filter without a group is
        // listed in no filter menu. Returns its command ID.
        createFilter: (desc) => gameList.createFilter(desc),
        getCurrentFilterId: () => gameList.getCurFilter().id,
        // Runs the current filter again, before() included.
        refreshFilter: () => { gameList.refreshFilter(); },
        // Always on top of the current filter, in effect at once; returns its id.
        createMetaFilter: (desc) => gameList.createMetaFilter(desc),
        // Makes the table at this wheel offset the current one, instantly:
        // no spin animation, no sound, no "gameselect".
        setWheelGame: (offset) => { gameList.setWheelGame(offset, { animate: false }); },

        // Only the mode name ("wheel", "menu", "popup", "running", "attract").
        getUIMode: () => mainWindow.getUIMode().mode,
        // The whole UI mode object; runMode is present only while a game
        // starts, runs or exits.
        getFullUIMode: () => mainWindow.getUIMode(),
        showMenu: (id, items, options) => { mainWindow.showMenu(id, items, options); },
        on: (eventName, handler) => { mainWindow.on(eventName, handler); },
        // The game list's own events, such as "gameselect" or "filterselect".
        onGameListEvent: (eventName, handler) => { gameList.on(eventName, handler); },
        createDrawingLayer: (zIndex) => mainWindow.createDrawingLayer(zIndex),
        removeDrawingLayer: (layer) => { mainWindow.removeDrawingLayer(layer); },
        // Fires no "underlaychange".
        setUnderlay: (filePath) => { mainWindow.setUnderlay(filePath); },
        // The image PinballY would pick for a global media file, such as
        // ("Images", "underlay"): the media folder first, then PinballY's
        // Assets folder; undefined when neither has one.
        resolveGlobalImage: (subfolder, baseName) => gameList.resolveMedia(subfolder, baseName, "image"),
        createStyledText: (options) => new StyledText(options),

        allocateCommand: (name) => command.allocate(name),
        // PinballY's own command IDs, such as "PlayGame" or "MenuReturn".
        getBuiltInCommand: (name) => command[name],
        doCommand: (id) => { mainWindow.doCommand(id); },
        // As a menu entry or a button runs it: "command" first, then
        // PinballY's own handling unless a listener prevented it.
        // doCommand() alone fires no "command" (JsDoCommand skips
        // FireCommandEvent), so a script's own command would do nothing.
        runCommand: (id) => {
            if (mainWindow.dispatchEvent(new CommandEvent(id))) mainWindow.doCommand(id);
        },
        playGame: (game) => { mainWindow.playGame(game); },

        // drawImage resolves relative paths from this folder, not from Scripts/.
        getProgramFolder: () => systemInfo.programDir,
        // Where the pack keeps its settings, Profiles and assets.
        getProjectFolder: () => projectFolderOf(systemInfo.programDir),
        // Read again on each call: a screen can be plugged in or out while
        // PinballY runs.
        countMonitors: () => {
            if (!user32) user32 = dllImport.bind("User32.dll", "int WINAPI GetSystemMetrics(int nIndex);");
            return user32.GetSystemMetrics(SM_CMONITORS);
        },
        showBackglass: (visible) => { backglassWindow.showWindow(visible); },
        // Through the Windows Media Player COM component, like the launch
        // sound; throws when it is unavailable or the file is missing
        // (Windows Media Player itself fails silently on a missing file).
        playSound: (filePath) => {
            requireSoundFile(filePath);
            if (!mediaPlayer) {
                const player = createAutomationObject("WMPlayer.OCX.7");
                player.settings.autoStart = true;
                mediaPlayer = player;
            }
            mediaPlayer.URL = filePath;
        },
        // For a short sound played in quick succession: its players, loaded
        // once, play it in turn. Restarting a player still playing blocks
        // PinballY for 60 to 130 ms, while one at rest starts in a few.
        // Shared by every caller asking for the same file, with the player
        // count of the first. Throws like playSound().
        createSoundRotation: (filePath, playerCount) => {
            if (!soundRotationsBySession.has(createAutomationObject)) soundRotationsBySession.set(createAutomationObject, new Map());
            const rotations = soundRotationsBySession.get(createAutomationObject);
            if (rotations.has(filePath)) return rotations.get(filePath);
            requireSoundFile(filePath);
            const players = [];
            for (let index = 0; index < playerCount; index++) {
                const player = createAutomationObject("WMPlayer.OCX.7");
                player.settings.autoStart = false;
                player.URL = filePath;
                players.push(player);
            }
            let next = 0;
            const rotation = {
                play: () => {
                    const player = players[next];
                    next = (next + 1) % players.length;
                    player.controls.currentPosition = 0;
                    player.controls.play();
                },
            };
            rotations.set(filePath, rotation);
            return rotation;
        },
        files: createFileSystem(),
        log: (text) => { logfile.log(text); },
    };
}
