// ============================================================
// Production PinballY host: the single seam through which the shared modules
// reach PinballY (settings, clock, timers, tables, wheel, menus, layers,
// sounds, files, programs, restart, HTTP, registry, logfile.log).
// Every call passes straight through to PinballY's globals; tests use
// tests/support/fake_pinbally_host.js. No side effects on import.
// ============================================================

const ADODB_TEXT_TYPE = 2;
const ADODB_READ_ALL = -1;
const ADODB_SAVE_OVERWRITE = 2;
// Behind PinballY's own background layer (z 0), so the probe never shows.
const IMAGE_PROBE_Z_INDEX = -1000;
// GetSystemMetrics index: the number of display monitors on the desktop.
const SM_CMONITORS = 80;
// Scripting.FileSystemObject's GetSpecialFolder id of the user's temporary folder.
const TEMPORARY_FOLDER = 2;
// ShellExecuteW's show command: hidden.
const SW_HIDE = 0;
// ShellExecuteW returns a number above this on success, an error code otherwise.
const SHELL_EXECUTE_MAX_ERROR = 32;
// CreateFileW's arguments for a read that leaves the file open to other
// readers and writers, so VPX never finds it busy.
const GENERIC_READ = 0x80000000;
const FILE_SHARE_READ_WRITE = 0x1 | 0x2;
const OPEN_EXISTING = 3;
const FILE_ATTRIBUTE_NORMAL = 0x80;
// Under the user's temporary folder: the wrapper script, each run's files,
// and the helpers' ready files and logs.
const PACK_TEMPORARY_FOLDER_NAME = "PinballYExpansionPack";
// In the pack's tools folder; see their own header for what they do.
const RESTART_HELPER_NAME = "restart_pinbally.ps1";
const PACK_UPDATE_HELPER_NAME = "pack_update.ps1";
const HELPER_POLL_MS = 200;
const RESTART_READY_TIMEOUT_MS = 15000;
// Longer: the Pack Update helper downloads and checks the release first.
const PACK_UPDATE_READY_TIMEOUT_MS = 120000;
// The Pack Update helper's ready file and log, in the pack's temporary folder.
const PACK_UPDATE_FILE_BASE_NAME = "pack-update";
// The Pack Update helper's log as the owner types it in Explorer's address bar.
export const PACK_UPDATE_LOG_HINT = `%TEMP%\\${PACK_TEMPORARY_FOLDER_NAME}\\${PACK_UPDATE_FILE_BASE_NAME}.log`;
// Given "<output file>" "<exit code file>" "<program>" "<args>"..., runs the
// program with its standard output in the first file and its standard error
// dropped, then writes its exit code to the second, through a .tmp file
// renamed once closed: that file appearing whole tells the run is over.
// The redirection comes first, since "echo 0> file" would redirect handle 0
// instead of writing "0".
const RUN_WRAPPER = "@echo off\r\n%3 %4 %5 %6 %7 %8 %9 > %1 2> nul\r\n"
    + "> \"%~2.tmp\" echo %errorlevel%\r\nmove /y \"%~2.tmp\" %2 > nul\r\n";
const MAX_PROGRAM_ARGS = 6;
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

// INVALID_HANDLE_VALUE, (HANDLE)-1, as a hexadecimal string on 32 or 64 bits.
const isInvalidHandle = handle => /^(0x)?f+$/i.test(handle.toString());

// A whole file's bytes, read through kernel32: ADODB.Stream and
// Scripting.FileSystemObject only read text. The handle is closed before
// returning, so the file is held for the read alone.
function createByteReader() {
    // Bound on the first read, then kept.
    let kernel32 = null;
    return (path) => {
        if (!kernel32) {
            kernel32 = dllImport.bind("Kernel32.dll", `
                HANDLE WINAPI CreateFileW(LPCWSTR lpFileName, DWORD dwDesiredAccess, DWORD dwShareMode, LPVOID lpSecurityAttributes, DWORD dwCreationDisposition, DWORD dwFlagsAndAttributes, HANDLE hTemplateFile);
                BOOL WINAPI GetFileSizeEx(HANDLE hFile, LONGLONG *lpFileSize);
                BOOL WINAPI ReadFile(HANDLE hFile, UINT8 *lpBuffer, DWORD nNumberOfBytesToRead, DWORD *lpNumberOfBytesRead, LPVOID lpOverlapped);
                BOOL WINAPI CloseHandle(HANDLE hObject);
            `);
        }
        const handle = kernel32.CreateFileW(path, GENERIC_READ, FILE_SHARE_READ_WRITE, null, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, null);
        if (isInvalidHandle(handle)) throw new Error(`Cannot open ${path}.`);
        try {
            const size = dllImport.create("LONGLONG");
            if (!kernel32.GetFileSizeEx(handle, size)) throw new Error(`Cannot read the size of ${path}.`);
            // The value is an Int64 object; its decimal text converts exactly for any file this small.
            const bytes = new Uint8Array(Number(String(size.value)));
            if (bytes.length === 0) return bytes;
            // One read for the whole file: the help does not say whether a
            // subarray passes its own offset, and these files are a few KB.
            const readCount = dllImport.create("DWORD");
            if (!kernel32.ReadFile(handle, bytes, bytes.length, readCount, null) || readCount.value !== bytes.length) {
                throw new Error(`Cannot read ${path} whole.`);
            }
            return bytes;
        } finally {
            kernel32.CloseHandle(handle);
        }
    };
}

function createFileSystem() {
    let fileSystemObject = null;
    const fso = () => {
        if (!fileSystemObject) fileSystemObject = createAutomationObject("Scripting.FileSystemObject");
        return fileSystemObject;
    };

    const readText = (path) => {
        const stream = openUtf8Stream();
        try {
            stream.LoadFromFile(path);
            // ADODB.Stream keeps the UTF-8 byte order mark it writes itself.
            return stream.ReadText(ADODB_READ_ALL).replace(/^\uFEFF/, "");
        } finally {
            stream.Close();
        }
    };
    const writeText = (path, text) => {
        const stream = openUtf8Stream();
        try {
            stream.WriteText(text);
            stream.SaveToFile(path, ADODB_SAVE_OVERWRITE);
        } finally {
            stream.Close();
        }
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
        // Each file of the folder as { name, modified (ms), size }; null when
        // the folder doesn't exist.
        listFileInfos: (folderPath) => {
            if (!fso().FolderExists(folderPath)) return null;
            const infos = [];
            for (const file of fso().GetFolder(folderPath).Files) {
                infos.push({ name: file.Name, modified: new Date(file.DateLastModified).getTime(), size: Number(file.Size) });
            }
            return infos;
        },
        fileExists: (path) => fso().FileExists(path),
        folderExists: (path) => fso().FolderExists(path),
        // The whole file as a Uint8Array; throws when it is missing or unreadable.
        readBytes: createByteReader(),
        readText,
        writeText,
        // Read whole and saved again, in UTF-8: ADODB.Stream cannot open a
        // file for appending, and Scripting.FileSystemObject appends in ANSI
        // only. Creates a missing file.
        appendText: (path, text) => { writeText(path, (fso().FileExists(path) ? readText(path) : "") + text); },
        // Throws when the target already exists.
        renameFile: (fromPath, toPath) => { fso().MoveFile(fromPath, toPath); },
        deleteFile: (path) => { fso().DeleteFile(path); },
        // Does nothing when the folder exists; its parent folder must exist.
        createFolder: (folderPath) => {
            if (!fso().FolderExists(folderPath)) fso().CreateFolder(folderPath);
        },
        // The file's modified date (ms) and size in bytes; null when it doesn't exist.
        getFileInfo: (path) => {
            if (!fso().FileExists(path)) return null;
            const file = fso().GetFile(path);
            // PinballY hands a COM date over as a Date.
            return { modified: new Date(file.DateLastModified).getTime(), size: Number(file.Size) };
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

// Numbered across hosts, so two runs never share their files, and named
// after the session's start, so a run of an earlier session never does either.
const RUN_SESSION = Date.now();
let nextRunNumber = 1;

// The pack's folder under the user's temporary folder, created when missing.
function preparePackTemporaryFolder(files) {
    const fso = createAutomationObject("Scripting.FileSystemObject");
    const folder = `${fso.GetSpecialFolder(TEMPORARY_FOLDER).Path}\\${PACK_TEMPORARY_FOLDER_NAME}`;
    files.createFolder(folder);
    return folder;
}

// Starts a program hidden, without waiting: ShellExecuteW returns at once.
// Not WScript.Shell's Run: PinballY's COM bridge does not offer it ("Object
// doesn't support property or method 'Run'" on the cabinet).
function createHiddenStarter() {
    // Bound on the first start, then kept.
    let shell32 = null;
    // what: the program as the error names it.
    return (program, parameters, what = program) => {
        if (!shell32) {
            shell32 = dllImport.bind("Shell32.dll", `
                HINSTANCE WINAPI ShellExecuteW(HWND hwnd, LPCWSTR lpOperation, LPCWSTR lpFile, LPCWSTR lpParameters, LPCWSTR lpDirectory, INT nShowCmd);
            `);
        }
        const instance = shell32.ShellExecuteW(null, "open", program, parameters, null, SW_HIDE).toNumber();
        if (instance <= SHELL_EXECUTE_MAX_ERROR) throw new Error(`ShellExecuteW could not start ${what} (error ${instance}).`);
    };
}

// Runs programs hidden through cmd.exe, which shows no window with
// SW_HIDE; the output and exit code go through files that result() reads
// once the run is over.
function createProgramRunner(files, startHidden) {
    let runFolder = null;

    function prepareRunFolder() {
        if (runFolder) return runFolder;
        const folder = preparePackTemporaryFolder(files);
        // In ANSI through FileSystemObject: the UTF-8 byte order mark
        // ADODB.Stream writes would break the script's first line.
        const wrapper = createAutomationObject("Scripting.FileSystemObject").CreateTextFile(`${folder}\\run.cmd`, true, false);
        try {
            wrapper.Write(RUN_WRAPPER);
        } finally {
            wrapper.Close();
        }
        runFolder = folder;
        return folder;
    }

    return (programPath, args) => {
        if (args.length > MAX_PROGRAM_ARGS) throw new Error(`At most ${MAX_PROGRAM_ARGS} program arguments, not ${args.length}.`);
        const folder = prepareRunFolder();
        const basePath = `${folder}\\run-${RUN_SESSION}-${nextRunNumber++}`;
        const outputPath = `${basePath}.out`;
        const codePath = `${basePath}.code`;
        const quoted = [`${folder}\\run.cmd`, outputPath, codePath, programPath, ...args].map(text => `"${text}"`).join(" ");
        // cmd.exe strips the outer quotes and keeps each quoted argument.
        startHidden("cmd.exe", `/d /c "${quoted}"`, `cmd.exe for ${programPath}`);

        let result = null;
        return {
            // null while the program runs, then { exitCode, output }.
            result: () => {
                if (result) return result;
                if (!files.fileExists(codePath)) return null;
                const code = files.readText(codePath).trim();
                if (!/^-?\d+$/.test(code)) throw new Error(`Not an exit code in ${codePath}: "${code}"`);
                const output = files.fileExists(outputPath) ? files.readText(outputPath) : "";
                result = { exitCode: Number(code), output };
                files.deleteFile(codePath);
                if (files.fileExists(outputPath)) files.deleteFile(outputPath);
                return result;
            },
        };
    };
}

// Quits PinballY for a PowerShell helper of tools\, started hidden as
// PinballY's own child, which outlives its Quit (no WMI needed, as tried on
// the cabinet). The helper reads PinballY's command line while it is alive,
// so Quit runs only once its ready file exists; onFailed after readyTimeoutMs
// without it (docs/adr/0017).
function createHelperQuitter(files, startHidden, { helperName, fileBaseName, readyTimeoutMs, errorLabel }) {
    // Bound on the first start, then kept.
    let kernel32 = null;
    // helperArgs: the helper's own arguments after the common ones, { name: value }.
    return ({ onQuitting, onFailed }, helperArgs = {}) => {
        const folder = preparePackTemporaryFolder(files);
        const readyPath = `${folder}\\${fileBaseName}-ready`;
        // Left by an earlier start that never quit.
        if (files.fileExists(readyPath)) files.deleteFile(readyPath);
        if (!kernel32) kernel32 = dllImport.bind("Kernel32.dll", "DWORD WINAPI GetCurrentProcessId();");
        const helperPath = `${projectFolderOf(systemInfo.programDir)}\\tools\\${helperName}`;
        // A quote would end the argument early and pass the rest as others.
        const quoted = Object.entries(helperArgs).find(([, value]) => String(value).includes("\""));
        if (quoted) throw new Error(`A quote in the ${errorLabel}'s -${quoted[0]} argument.`);
        const ownArgs = Object.entries(helperArgs).map(([name, value]) => ` -${name} "${value}"`).join("");
        startHidden("powershell.exe", `-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "${helperPath}"`
            + ` -ParentPid ${Number(kernel32.GetCurrentProcessId())} -ReadyFile "${readyPath}" -LogFile "${folder}\\${fileBaseName}.log"${ownArgs}`);
        let waitedMs = 0;
        const poll = setInterval(() => {
            waitedMs += HELPER_POLL_MS;
            try {
                if (files.fileExists(readyPath)) {
                    clearInterval(poll);
                    onQuitting();
                    mainWindow.doCommand(command.Quit);
                } else if (waitedMs >= readyTimeoutMs) {
                    clearInterval(poll);
                    onFailed(new Error(`The ${errorLabel} was not ready after ${readyTimeoutMs / 1000} s.`));
                }
            } catch (error) {
                // A poll that fails would fail again every 200 ms.
                clearInterval(poll);
                onFailed(error);
            }
        }, HELPER_POLL_MS);
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
    const files = createFileSystem();
    const startHidden = createHiddenStarter();

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
        // Hidden tables included.
        getAllTables: () => gameList.getAllGames(),
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
        // The filter by its id ("All", "User.<id>"...); its cmd is its main
        // menu item's command, for this session only.
        getFilterInfo: (filterId) => gameList.getFilterInfo(filterId),
        getCurrentFilterId: () => gameList.getCurFilter().id,
        // The current filter's title as PinballY's menus show it, in English
        // (FilterInfo.title; FilterInfo has no menuTitle): for display only,
        // never to recognise a filter by.
        getCurrentFilterTitle: () => gameList.getCurFilter().title,
        // The command of the main menu item opening the current filter's
        // group (FilterByEra...); undefined for a top-level filter.
        getCurrentFilterGroupCmd: () => gameList.getCurFilter().groupCmd,
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
        // The wheel's icons, hidden or shown again.
        showWheel: (visible) => { mainWindow.showWheel(visible); },
        // The launch overlay's background layer: exists only during a launch,
        // cannot be removed, moved or resized.
        getLaunchOverlayBackground: () => mainWindow.launchOverlay.bg,
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
        // { display, semantic, build, ... }: read the release status from semantic
        // (docs/pinbally/pinbally-help.md §2.10).
        getPinballYVersion: () => systemInfo.version,
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
        // Runs the program hidden, without waiting; returns { result() },
        // null while it runs, then { exitCode, output } (its standard output;
        // its standard error is dropped). At most MAX_PROGRAM_ARGS arguments.
        runHiddenProgram: createProgramRunner(files, startHidden),
        // Quits PinballY for a helper to start it again, as it was started;
        // onQuitting() runs right before Quit, onFailed(error) instead when
        // the helper cannot get ready, PinballY then staying open.
        restartPinballY: createHelperQuitter(files, startHidden, {
            helperName: RESTART_HELPER_NAME, fileBaseName: "restart", readyTimeoutMs: RESTART_READY_TIMEOUT_MS, errorLabel: "restart helper",
        }),
        // Quits PinballY, as restartPinballY() does, for the Pack Update
        // helper to download zipUrl, check its sha256 and install packVersion
        // over the pack folder, then start PinballY again.
        startPackUpdate: (() => {
            const quitForHelper = createHelperQuitter(files, startHidden, {
                helperName: PACK_UPDATE_HELPER_NAME, fileBaseName: PACK_UPDATE_FILE_BASE_NAME, readyTimeoutMs: PACK_UPDATE_READY_TIMEOUT_MS, errorLabel: "Pack Update helper",
            });
            return ({ zipUrl, sha256, packVersion, onQuitting, onFailed }) => quitForHelper({ onQuitting, onFailed }, {
                ZipUrl: zipUrl, Sha256: sha256, PackVersion: packVersion, PackFolder: projectFolderOf(systemInfo.programDir),
            });
        })(),
        // A GET through PinballY's HttpRequest (MSXML), always asynchronous:
        // a synchronous one freezes PinballY. A Promise of the reply text,
        // rejected for any status but 200.
        httpGet: (url, headers = {}) => {
            const request = new HttpRequest();
            request.open("GET", url, true);
            for (const [name, value] of Object.entries(headers)) request.setRequestHeader(name, value);
            return request.send();
        },
        // A registry value by its full path ("HKCU\\Software\\...\\name");
        // null when it is missing.
        readRegistryValue: (path) => {
            const shell = createAutomationObject("WScript.Shell");
            let value;
            try {
                value = shell.RegRead(path);
            } catch (error) {
                // A method PinballY's COM bridge does not offer throws a
                // TypeError, which must not pass for a missing value.
                if (error instanceof TypeError) throw error;
                // RegRead throws on a missing value: that is the answer.
                return null;
            }
            return String(value);
        },
        files,
        log: (text) => { logfile.log(text); },
    };
}
