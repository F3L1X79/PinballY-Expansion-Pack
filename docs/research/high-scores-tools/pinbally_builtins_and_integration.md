# PinballY built-ins for high scores, and integration paths for an add-on

Date: 2026-10-11. Builds on `docs/research/high-scores.md` (2026-10-10, "HS" below). This file does not repeat what HS already says; it adds the GitHub history, the exact JS hand-off rules, the ways to run a program or read a file from JS, and the VPReg status.

Sources read on 2026-10-11:
- GitHub API on `mjrgh/PinballY`: issue #277 and its 4 comments; issue search for "high score", "pinemhi", "VPReg", "highscores", "hiscore", "romless", "pinballyHighScores" (issues and PRs); releases; commits on `PINemHi/` and `PinballY/HighScores.cpp`; commit `d84763e` (`VersionHistory.txt`).
- PinballY source at master `d84763e` (2026-02-24): `PlayfieldView.cpp` (`RequestHighScores` L8168-8260, `ReceiveHighScores` L8262-8325, `JsGetHighScores` L2319-2410, `JsSetHighScores` L2412-2458), `HighScores.cpp` (L965-1040).
- Local help (1.1.0 Beta 10): `Help/HighScoresEvent.html`, `Help/HighScores.html`, `Help/GameInfo.html`, `Help/RunProgramExample.html`, `Help/OLEAutomation.html`, `Help/Javascript.html`, `Help/DllImport.html`, `Help/COMPointer.html`; `docs/pinbally/pinbally-examples.md`.
- VPX: `github.com/vpinball/vpinball/releases` (HTML), master `src/core/ScriptGlobalTable.cpp` L527-623, `docs/Changelog.txt`, `src/core/vpversion.h`.
- Microsoft Learn: `StgOpenStorage`, WSH `Run` method, `WshScriptExec.StdOut`.
- pinemhi.com `code.php` and `code_show.php` (snippets for Futurama and Pulp Fiction).

Not reached: `api.github.com` for `vpinball/vpinball` was refused by the sandbox proxy (used raw files and the HTML release page instead); the Microsoft page for `WshShell.Exec` itself (the URL I tried was the `WshScriptExec` object page).

**Fact** = read in a primary source. **Inference** = my reading. **Verify** = cabinet test.

## 1. What PinballY already provides

### 1.1 Versions (Fact)
- Latest PinballY release: **1.1.0 Beta 10**, 2024-11-03 (release notes: media capture fixes only). Earlier: Beta 9 (2024-09-25, FFmpeg), Beta 8 (2024-09-21, termination options, `gamestarted` fix), Beta 7a (2024-08-31, VS 2022, ChakraCore update, 64-bit DOF). None of these mention high scores.
- Master moved to `d84763e` on 2026-02-24 with no release since. Unreleased changes in `VersionHistory.txt`: recursive scan of table subfolders (for VPX 10.8.1's per-table folders) and daily `GameStats.csv` backups. Nothing about high scores.
- High-score code last touched: `HighScores.cpp` in `c5f365f` (2022-07-17, warnings), `.pinballyHighScores` support added in `23f99fb` (2020-05-30, "to supplement PINemHi high scores for EM games"), JS high score features in `95d7bde` (2019-03-07).
- **Bundled PINemHi is still 1.3.1 (2015).** The `PINemHi/` folder was touched only by the initial commit (2018-07-17), `0414c92` (2018-09-22) and `c2e0a03` (2024-08-30, `pinemhi.ini` only).

### 1.2 Issue #277 "Pinemhi - Update for ROMless tables" (Fact)
- Opened 2026-02-25 by DJOMaverick, **still open** on 2026-10-11, no linked commit. Ask: newer PINemHi supports ROM-less originals (Futurama, Blood Machines…); please update PinballY so it shows those boards.
- mjrgh (2026-02-25): "I'll update my copy when I get a chance… PinballY just calls out to the copy of the .exe that's in your PinballY folder, so you can update it manually at any time." No update since (last commit 2026-02-24).
- DJOMaverick (2026-02-28): dropping the new PINemHi into the folder "doesn't do the trick": PinballY never asks it about ROM-less tables.
- mjrgh (2026-02-28): suggests putting PINemHi's fake ROM name in the game's ROM field so PinballY calls PINemHi with it, and turning on high score logging.
- DJOMaverick: PINemHi "loads a dummy rom… then saves the scores out to a (not nv) file", and asks whether PinballY's custom `pinemhi.ini` limits what is scanned. Unanswered.
- **Inference**: mjrgh's workaround cannot work as is, because PinballY only runs PINemHi when `<rom>.nv` exists in the NVRAM folder (HS A1, `HighScores.cpp` `Valid()`). A fake ROM name gives no `.nv`, so PinballY skips PINemHi.

### 1.3 What PINemHi's "ROM-less support" really is (Fact, pinemhi.com)
- `code.php` lists 46 originals (Futurama, Pulp Fiction, Dune, Munsters…). Each needs **two snippets pasted into the table script**, "ONLY … PINEMHI VERSION 3.6.7 OR ABOVE", with `romsub.exe` in the tables folder:
  1. after the table's `Loadhs`: `fakerom = "futurama"` then `WScript.Shell.Run "romsub " & fakerom, 0`;
  2. in `Table1_Exit`: write `UserDirectory & fakerom & ".pmh"` holding **the last game's score**, multiplied by 6 and with digits swapped for letters (`5→l, 3→L, 8→i, 6→I, 1→o, 4→O, 7→t, 2→j, 9→z, 0→s`), plus an empty `rsoff.pmh`.
- **Inference**: this feeds PINemHi's online LeaderBoard with the last score, not a top-N board. It needs a script edit per table. It is not a path for this pack. The `VPReg.stg` reading in 3.6.8 (HS A5) is separate and still keyed by storage name.

### 1.4 Related issues (Fact)
- **#271** (2025-09-10, open): unsupported games show PINemHi's "not supported" text on the DMD. mjrgh: "PinballY is just passing it through". Example: *The Empire Strikes Back (Hankin 1980)*. This confirms HS A3: a "Not supported rom" text arrives as a board with `success: true`.
- **#74** (2019, closed): boards missing for some ROMs; the `.nv` suffix workaround in the ROM field breaks DMD colours. Answer: High Score Retrieval logging (added in Beta 15), which logs the `.nv` search and the PINemHi command line. Sample log in #243 shows the 1.3.1 banner and a T2 board (`GRAND CHAMPION` / `TOP MARKSMEN`, `.` thousands separator).
- **PR #196** (2021, open, unmerged): append `.nv` when the ROM field is set, for ROMs with several `.nv` (`totan_12`/`totan_14`).
- **#97** (2019, closed): no FX3 support; mjrgh points to `HighScoresEvent` for systems PINemHi does not handle: "That'll make high scores show up in the usual places (DMD window and game info popup)."
- **#191** (open): PINemHi crash (`System.IO.IOException`), fixed by deleting a corrupt `.nv`.
- **#243** (closed): VPinMAME not saving on exit is due to **Kill Process**; Close Window lets it exit cleanly (HS C).
- **#190** (open): no option to hide high scores.
- No issue or PR mentions `VPReg`.

### 1.5 JS API (Fact; help + source)
| API | Semantics |
|---|---|
| `gameList.on("highscoresrequest", ev)` | Fired whenever a game in state `Init` is asked for scores with JS notification, **before** any `.nv` check, so **also for EM and original tables** (`RequestHighScores` L8174-8197). `ev.game` is the `GameInfo`. `ev.preventDefault()` cancels the PINemHi run. If JS has not called `setHighScores()` inside the handler, the game becomes `Failed` (`OnHighScoresReady(..., "javascript")`). |
| `gameList.on("highscoresready", ev)` | `ev.game`, `ev.success`, `ev.scores` (string array), `ev.source`. Cannot be cancelled. The help lists `"cache" / "file" / "javascript" / "pinemhi"`, but the event only carries `"pinemhi"`, `"file"` or `"none"` (HS A1). |
| `gameInfo.getHighScores()` | Promise of a string array with a `.source`. Also triggers a request with JS notification, so it fires the two events above (L2397-2400). Rejected with `Error("High scores not available")` + `.source` on failure. |
| `gameInfo.setHighScores(lines)` | Replaces PinballY's in-memory board, sets status `Received`, resolves pending promises with source `"javascript"`, and redraws the DMD / info box (`ApplyHighScores`). Does **not** fire `highscoresready`. A PINemHi result that lands later is ignored (L8304-8306). Writes nothing to disk (`Help/GameInfo.html`). |
| `gameInfo.setHighScores(null)` | Forgets the board: status back to `Init`, **except** when status is `Requested` (PINemHi running), which is kept so that its result still lands (L2425-2434). Refines HS C "stale cache": `setHighScores(null)` does not cancel an in-flight request. |
| `<table>.pinballyHighScores` | Plain ANSI text next to the table file, same base name; read only when PINemHi did not succeed (`Help/HighScores.html` part II). |
| `gameInfo.resolveROM()`, `resolveGameFile()` | ROM / NVRAM path / table path (HS A1). |

Display: lines are shown on the video DMD, a real DMD and the info box; blank lines split screens; the style (DMD / Alpha / TT typewriter for pre-1978) comes from the metadata (`Help/HighScores.html`).

**Answer: yes, a JS add-on can feed boards for EM and original tables to PinballY's display.** Two documented patterns (`Help/HighScoresEvent.html` § "Setting custom scores"):
- **Override**: in `highscoresrequest`, `preventDefault()` and call `ev.game.setHighScores(lines)` **synchronously**.
- **Supplement**: in `highscoresready` with `success === false`, read our own source and call `ev.game.setHighScores(lines)`; asynchronous is fine (status goes from `Failed` to `Received`).
- Caution (Inference): the supplement pattern does not trigger on "Not supported rom" text (`success: true`); detect that text. And a `setHighScores()` board becomes the "cached" board that the next `getHighScores()` returns, so the add-on must keep its own before/after snapshots and never read its own output back as a fresh board.

### 1.6 What an add-on must build itself (Inference)
- A parser for PINemHi text (HS A3), a before/after diff, and the Play bracket (`prelaunch` / `gameover` / fresh request).
- Any source PinballY does not read: `VPReg.stg`, `VPReg.ini`, EM text files in `User`.
- Optionally, feeding those boards back with `setHighScores()` so the DMD shows them too (free once they are parsed; one formatter to PinballY's line/blank-line layout).

## 2. Running an external program from JS

### 2.1 What the docs offer (Fact)
- `Help/RunProgramExample.html`: `ShellExecuteW` via `dllImport.bind("Shell32.dll", …)` (fire-and-forget, recommended for simple cases), and a full `CreateProcessW` example (`STARTUPINFO`, `PROCESS_INFORMATION`, `CloseHandle`). It says CreateProcess/ShellExecuteEx "give you more options, including the ability to monitor the process for completion". No stdout capture shown.
- `Help/Javascript.html`: JS runs on the UI thread; anything over ~30-50 ms freezes video and input; use timeouts/intervals, never waits.
- `Help/OLEAutomation.html`: `createAutomationObject(progId)` is VB `CreateObject`; arrays are unsupported; no COM event sinks.
- Community examples: `PinMAME_functions` launches an EXE that writes a temp file and reads it later (racy); `menu_submenu_batch_file` shells out (`docs/pinbally/pinbally-examples.md`).
- PinballY's own PINemHi call: `CreatePipe` + `CreateProcess(..., CREATE_NO_WINDOW)` + `STARTF_USESTDHANDLES`, `WaitForSingleObject(h, 7500)` then `ReadFile` on the pipe, **on a background thread** (`HighScores.cpp#L965-L1040`).

### 2.2 Options (Fact from Microsoft docs where marked, otherwise Inference)
| Route | Hidden window | Blocks UI | Output capture |
|---|---|---|---|
| `WScript.Shell.Run(cmd, 0, false)` | Yes (`0` = "Hides the window", Microsoft `Run` doc) | No: "returns immediately… returning 0" (Fact) | Only via `cmd /c "prog args > %TEMP%\x.txt"`, then poll with `setTimeout` (file exists and is complete, e.g. a sentinel written after: `prog > a.txt & ren a.txt done.txt`) |
| `WScript.Shell.Run(cmd, 0, true)` | Yes | **Yes**, until the program exits (Fact) | Same temp file. Unacceptable on the UI thread except for sub-50 ms tools |
| `WScript.Shell.Exec(cmd)` | **No**: no window-style argument, a console program gets a visible console window (Inference, well-known; **Verify**) | `Exec` returns at once; `StdOut.ReadAll()` blocks until EOF; poll `.Status` with `setTimeout` | Yes, `StdOut` TextStream (Fact: `WshScriptExec.StdOut`). Pipe can fill if not drained |
| `dllImport` `CreateProcessW` with `CREATE_NO_WINDOW` (0x08000000), stdout redirected to a file handle (`CreateFileW` with an inheritable `SECURITY_ATTRIBUTES`, `STARTF_USESTDHANDLES`), then `WaitForSingleObject(hProcess, 0)` polled by `setTimeout` | Yes (as PinballY does) | No | Yes, read the file with FSO/ADODB afterwards. Must `CloseHandle` everything; a wrong struct crashes PinballY |
| `ShellExecuteW(..., SW_HIDE)` | Yes for GUI apps; a console app may still flash (Inference) | No | No (needs `cmd /c` redirection) |

**Cheapest robust path (Inference)**: `createAutomationObject("WScript.Shell").Run('cmd /c ""exe" args > "tmp.txt" 2>&1 & ren …"', 0, false)` plus a `setTimeout` poll on FSO. No struct definitions, no handle leaks, no console flash. `Exec` is simpler but flashes a console on a cabinet. A pipe `ReadFile` from JS would block the UI thread, so do not copy PinballY's pipe approach.

## 3. Reading files from JS

### 3.1 Text files (Fact)
- `Scripting.FileSystemObject` (`Help/Javascript.html`, `Help/OLEAutomation.html`) and `ADODB.Stream` for UTF-8 are already used in `common/core/pinbally_host.js` and `common/core/config.js`. This covers `VPReg.ini`, EM `.txt` files in `User`, `.pinballyHighScores`, PINemHi output files. FSO also gives `DateLastModified`, `Files` listings.

### 3.2 Binary `VPReg.stg` (OLE compound file)
- **ole32 via `dllImport`: feasible on paper.** `dllImport.define` accepts COM interfaces in IDL or `MIDL_INTERFACE` syntax, copy-pasted from the SDK `.idl`; only `IUnknown` is predefined; method order must match the vtable exactly; `Interface**` out-parameters accept a plain `Interface*` variable; `INT64`/`UINT64` are supported (`Help/DllImport.html` § "COM and OLE objects", types table). `StgOpenStorage(pwcsName, null, grfMode, null, 0, IStorage**)` (Microsoft Learn); valid read modes include `STGM_DIRECT | STGM_READ | STGM_SHARE_DENY_WRITE`, or `STGM_DIRECT_SWMR | STGM_READ | STGM_SHARE_DENY_NONE` (single-writer multi-reader). You would define `IStorage`, `IStream`, `IEnumSTATSTG`, `STATSTG` (`FILETIME`, `ULARGE_INTEGER`, `CLSID`) and free each `pwcsName` with `CoTaskMemFree`. **No official or community example** of this exists (help, examples repo).
- **A key catch (Fact + Inference)**: "The COMPointer object itself automatically calls `Release()` when the Javascript object is deleted by the garbage collector… don't call `Release()`… unless you made a matching call to `AddRef()`" (`Help/COMPointer.html`). So **the storage file stays open until a GC**, at an unknown time. VPX opens `VPReg.stg` with `STGM_SHARE_EXCLUSIVE` on every `LoadValue`/`SaveValue` and silently gets `""` on failure (HS B2). An `IStorage` still alive when the next table starts can make that table load an empty board and save it back. Workaround: `AddRef()` + `Release()` twice by hand (allowed by the "matching call" rule) or force the last ref release explicitly; fragile. **Verify** if this route is chosen.
- **Bytes + pure-JS parser (recommended, Inference)**: `kernel32` `CreateFileW(path, GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE, …)`, `GetFileSizeEx`, `ReadFile` into a `Uint8Array` (typed arrays are passed as native buffers, `Help/DllImport.html` § "Typed Arrays"), then an explicit `CloseHandle`: the file is held for a few ms only. Parse the CFB format (header, FAT, mini-FAT, directory; UTF-16LE streams) in plain JS, testable under `node --test`. Precedent: **VPX itself now reads legacy `VPReg.stg` with POLE**, a small portable C++ compound-file parser, not ole32 (`ScriptGlobalTable.cpp` L576-610).
- `ADODB.Stream` binary mode cannot hand bytes to JS (arrays unsupported in automation, HS B5).

### 3.3 Where the files are (Fact, from HS B1 + master re-check)
- `VPReg.stg`: `<VPX folder>\User\VPReg.stg` (10.7.x, 10.8.0, and 10.8.1 in "AppOnly"/legacy layout); `<table folder>\user\VPReg.stg` with the new per-table layout of 10.8.1 (FileLocator, falls back to the AppOnly path for reads while that folder does not exist).
- `VPReg.ini`: same folder as above, only from VPX master `f30d525` (2026-08-30) onward, not in any release yet.

## 4. Does VPX 10.8+ still write `VPReg.stg`? (Fact)
- Releases page on 2026-10-11: **latest stable = 10.8.0 (`v10.8.0-2051-28dd6c3`)**; newest pre-release `v10.8.1-5436-af26b2d93` (2026-08-21). No release since. Both **write `VPReg.stg`**.
- VPX master (version 10.8.1 in `vpversion.h`): `SaveValue` **writes only `VPReg.ini`** (whole file read and rewritten, case-insensitive names, value via `BstrFromVariant(…, 0x409)`); `LoadValue` reads `VPReg.ini` and, **only when a value is missing**, falls back to the legacy `VPReg.stg` ("VPX used to save table persisted values in a OLE container… try to locate & load from a legacy file"). The `.stg` is never written or migrated. `docs/Changelog.txt` (10.8.1) describes the new folder layout but does not mention VPReg.
- **Inference**: a binary `.stg` reader is needed **today** (every released Windows VPX). Once 10.8.1 final ships, writes move to `.ini`; old boards that a table never re-saves stay in `.stg`; a table that re-saves `HighScore1..4` puts all of them in `.ini` (the table saves its full board in one go). So during the transition: read `.ini` first, then `.stg` per value, like VPX does. The `.ini` reader is trivial (FSO + a 20-line INI parser); the `.stg` reader is the expensive piece and its lifetime is limited to cabinets still on 10.8.0 or earlier pre-releases.

## 5. Cheapest integration path for extra sources (Inference)
1. **ROM tables**: PinballY's board as is (`highscoresready` / `getHighScores()`), plus detection of "Not supported rom". No external tool. Optional user step: drop PINemHi 3.6.8 into `<PinballY>\PINemHi\` for the 317 newer ROMs (HS A5; **Verify** compatibility). Do not run PINemHi ourselves: it gives nothing for ROM-less tables without the per-table storage name, needs `7z.exe`, and cannot be shipped.
2. **Originals (`SaveValue`)**: `VPReg.ini` reader (cheap, future-proof) + `VPReg.stg` byte reader with a JS CFB parser (one-time cost; `dllImport` surface = `CreateFileW`/`GetFileSizeEx`/`ReadFile`/`CloseHandle`). Read before launch and after `gameover`, never while VPX runs. Map storage to game by diffing what changed during the Play (HS B4).
3. **EM tables (text files)**: FSO listing of the user folder(s) with `DateLastModified` > launch time, then a heuristic "N scores + N initials" block parser (HS B3, option 4).
4. **Display bonus**: format the boards from 2 and 3 as lines and call `setHighScores()` in the `highscoresready` `success === false` path, so EM/original tables show a typewriter/alpha board on the DMD like ROM tables. Cheap once 2 and 3 exist; not required for Achievements.
5. External tools (vpxtool, PINemHi 3.6.8) only as optional fallbacks, through `WScript.Shell.Run(..., 0, false)` + temp-file polling.

## Open questions / Verify
1. Does `WScript.Shell.Exec` flash a console window from PinballY (no console of its own)? Does `Run(…, 0, false)` with `cmd /c` stay invisible on the cabinet?
2. Can an `IStorage` obtained through `dllImport` be released deterministically (AddRef/Release balance) so the file is closed before VPX starts? Only relevant if the ole32 route is chosen.
3. Which VPX build runs on the cabinet (10.8.0 vs a 10.8.1 pre-release), hence `.stg` only or `.stg` + per-table folders?
4. Will mjrgh ship a PinballY update with PINemHi 3.6.8 (#277)? Even then, ROM-less boards stay out of PinballY's reach unless the `.nv` check is changed.
