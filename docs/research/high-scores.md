# Research: reading each table's high score board before and after a Play

Date: 2026-10-10. Question: how can an add-on read a table's high score board **before** and **after** a Play, so that a score that appeared during the Play can be credited to the active Profile (glossary: High Score, Table Record in `GLOSSARY.md`)? The cabinet has about 100 tables: (1) VPX re-creations of solid-state machines with a VPinMAME ROM, (2) VPX re-creations of EM machines without a ROM, (3) VPX originals without a ROM, maybe some Future Pinball.

Sources (all read on 2026-10-10):
- **PinballY** at master `d84763e` (2026-02-23), cited `HighScores.cpp#Lnn` = `https://github.com/mjrgh/PinballY/blob/d84763e/PinballY/HighScores.cpp#Lnn` (same for `PlayfieldView.cpp`, `Application.cpp`, `GameList.cpp`, `GameList.h`, `PINemHi/...`). The high score code is the same in tag `1.1.0-Beta10` (no diff in `HighScores.cpp`, `PINemHi/pinemhi.exe` or the high score lines of `PlayfieldView.cpp`).
- **Local help** `docs/pinbally/Help/*.html` (PinballY 1.1.0 Beta 10), cited `Help/<file>` + section.
- **VPX** (`github.com/vpinball/vpinball`), cited `vpx@<tag>:<path>#Lnn`. Tags read: `v10.7.4-433-a4c3788` (10.7.4), `v10.8.0-2051-28dd6c3` (10.8.0, marked "Latest" on the releases page), `v10.8.1-3788-2151290` (pre-release 2025-08-07, titled "DO NOT USE"), `v10.8.1-5436-af26b2d93` (pre-release 2026-08-21), and master `644890c` (2026-10-10, still version 10.8.1 in `src/core/vpversion.h`).
- **PinMAME** master `0b3770a`, cited `pinmame:<path>#Lnn`.
- **vpin-studio** main `b0d3577` (v5.4.3, 2026-10-09, MIT licence), cited `vps:<path>#Lnn`, with `vps:server/` = `vpin-studio-server/src/main/java/de/mephisto/vpin/server/`.
- **PINemHi binaries**: the 1.3.1 shipped with PinballY (`PINemHi/pinemhi.exe`, unchanged since the 2018 initial commit) and the 3.6.8 shipped by vpin-studio (`vps:resources/pinemhi/PINemHi.exe`). Both are .NET assemblies. I read their embedded strings with `strings -el`, so anything about their *behaviour* is **Inference**. Plus `https://www.pinemhi.com/` and `/code.php`.
- **Table script corpus**: `github.com/jsm174/vpx-standalone-scripts` at `70e22bb` (2026-10-05), 284 `.vbs` table scripts, cited `vss:<folder>/<file>#Lnn`. These are scripts patched for VPX standalone, so the sample leans to popular and recent tables. My counts come from regex heuristics (ROM table = `LoadVPM` / `VPinMAME.Controller` / `Controller.GameName =`; era from the year in the folder name).
- **pinmame-nvram-maps** (`github.com/tomlogic/pinmame-nvram-maps`) at `68c1b33`.

Not checked: the vpforums and vpuniverse PINemHi threads (HTTP 403), the contents of the PINemHi 3.6.8 zip (whether it ships `7z\7z.exe`), Future Pinball internals, and anything on the cabinet itself.

**Fact** = read in a primary source. **Inference** = my reading, not run. **Verify** = needs the cabinet prototype listed at the end.

## Verdicts

| # | Question | Verdict |
|---|---|---|
| A | ROM tables | **PinballY already does the work.** It runs its bundled **PINemHi 1.3.1** (2015, 1,240 ROMs) and hands the text to JS through `highscoresready` / `gameInfo.getHighScores()`. The text has to be parsed by the add-on (section titles, ranked lines, champion lines, stat lines). Main traps: "Not supported rom" output still comes back with `success: true` (Inference), about 317 newer ROM revisions are unknown to 1.3.1, and a cached board can come back as the "after" board. Reading raw `.nv` files ourselves is not realistic. |
| B | EM and original tables | **PinballY reads nothing for them**, except a `<table>.pinballyHighScores` file next to the `.vpx`, which few tables write. Their scores live in VPX's `SaveValue` store (**`VPReg.stg`**, an OLE compound file, in every released Windows VPX; `VPReg.ini` only on standalone builds and on master since 2026-08-30) or in **text files in the VPX `User` folder**. Key and file names are per author. Originals mostly use `SaveValue` with `HighScoreN` / `HighScoreNName`. EM tables mostly use text files. JS can read `.ini` and `.txt` through COM. Reading `.stg` needs `dllImport` (ole32 `IStorage`) or raw bytes plus a JS compound-file parser. |
| C | Timing | VPinMAME writes the `.nv` only when emulation stops, inside the table's `_Exit` event. `SaveValue` and text files are written whenever the script calls them, often only in `Table1_Exit`. PinballY fires `gameover` after the VPX process has exited, then requests fresh scores. **Kill Process**, or the 2.5 s close timeout running out, can lose the new board completely. |
| D | Coverage | ROM tables: high (most classic ROMs), to be measured with a one-pass inventory. EM: about 0 natively, high only with a text-file reader. Originals: about 0 natively, high with a `VPReg` reader. |
| E | Options | 1) PinballY board only; 2) plus a newer PINemHi; 3) plus a `VPReg` reader; 4) plus a `User`-folder text reader. See the end. |

## A. ROM tables (PINemHi)

### A1. How PinballY gets a board

**Facts**
- At startup PinballY reads VPinMAME's NVRAM folder from `HKCU`/`HKLM\Software\Freeware\Visual PinMame\globals\nvram_directory` (`HighScores.cpp#L47-L73`). A system's own NVRAM path setting overrides it (`#L307-L333`; `Help/GameSysInfo.html` `nvramPath`).
- It picks the `.nv` file in this order: (1) the game's `rom` field in the database, also looked up as a `[romfind]` friendly name; (2) the DOF ROM, which must match exactly one `<dofrom>[_suffix].nv` in the folder; (3) a fuzzy title match (Dice coefficient > 0.7) against `[romfind]` titles, which must match exactly one existing `.nv`. If several match, it gives up: "this is ambiguous" (`HighScores.cpp#L339-L519`, threshold `#L625`). JS sees the result through `gameInfo.resolveROM()` (`vpmRom`, `dofRom`, `nvramPath`) (`Help/GameInfo.html` resolveROM).
- **The `.nv` file must exist** (`Valid()`, `HighScores.cpp#L274-L291`, `#L594-L595`). Otherwise PinballY skips PINemHi and looks for `<table file minus extension>.pinballyHighScores` next to the table, read as ANSI text (`HighScores.cpp#L650-L672`, `#L723-L767`, `#L1083-L1098`; `Help/HighScores.html` § "ad hoc score files").
- PINemHi runs as `"<PinballY>\PINemHi\PINemHi.exe" <file>.nv`, hidden (`CREATE_NO_WINDOW`), one at a time through a queue, so it must finish within **7.5 s** or is killed (`HighScores.cpp#L715-L717`, `#L769-L820`, `#L988-L1017`, `#L1053-L1063`). Before each run PinballY rewrites `PINemHi.ini` with the right `[paths] VP=` / `FP=` line, from the copy it loaded at startup (`#L915-L956`).
- **"Success" only means that PINemHi exited in time.** Its stdout is decoded as ANSI and taken as the board, whatever it says (`HighScores.cpp#L1033-L1050`). The text is split into lines (`PlayfieldView.cpp#L8327-L8357`), and blank lines separate display groups (`GameList.cpp#L4945-L4971`). The comment there says PINemHi "usually uses the first line of a group as a header" (`#L4990-L5005`).
- JS gets the board in two ways:
  - **`gameList.on("highscoresready")`**, with `game`, `success`, `scores`, `source` (`PlayfieldView.cpp#L8148-L8167`, `#L8316-L8317`; `Help/HighScoresEvent.html`).
  - **`gameInfo.getHighScores()`**, a Promise whose array has a `.source` (`PlayfieldView.cpp#L2319-L2410`).
- `highscoresrequest` fires just before PinballY starts PINemHi. `preventDefault()` cancels the run, and the game then counts as failed unless JS called `setHighScores()` meanwhile (`PlayfieldView.cpp#L8177-L8198`). `gameInfo.setHighScores(lines)` stores a board and updates the DMD. `setHighScores(null)` forgets it, so the next request runs again (`PlayfieldView.cpp#L2412-L2458`; `Help/GameInfo.html` setHighScores).

**`source` quirks (Fact, from the code)**
- The `highscoresready` **event** only ever carries `"pinemhi"`, `"file"` or `"none"`. It gets `"none"` when PINemHi could not be launched, or timed out, or the file read failed (`HighScores.h#L167-L181`, `HighScores.cpp#L1043`, `#L1105`, `PlayfieldView.cpp#L8225`, `#L8317`). The help also lists `"cache"` and `"javascript"` for the event (`Help/HighScoresEvent.html` § Properties), but the code never fires the event with those.
- When the `.nv` is missing **and** there is no `.pinballyHighScores` file, the event still says `success: false, source: "pinemhi"`, although nothing ran (`PlayfieldView.cpp#L8215-L8226`).
- The **Promise** `.source` is always `"pinemhi"` for a fresh result, even when the board came from a `.pinballyHighScores` file (`PlayfieldView.cpp#L8321`). It is `"cache"` when the board was already in memory (`#L8234-L8242`), and `"javascript"` after `setHighScores()` or a cancelled request (`#L2454`, `#L8193`).
- Requests queued before the high score system is ready are replayed without the `highscoresrequest` / `highscoresready` events (`PlayfieldView.cpp#L8255-L8271`, `#L8316`).

### A2. Bundled version

**Facts**
- `PINemHi/Whatsnew PINemHi.txt` tops out at **1.3.1** ("Total Number of ROMS supported is now: 1240 … VP-Games 425", compatible with VPinMAME 3.0). The exe's banner reads "PINemHi written by Dna Disturber (2015) Version 1.3.1" (strings of `PINemHi/pinemhi.exe`). Git history touches the folder in 2018 (initial commit) and in `c2e0a03` (2024-08-30, `pinemhi.ini` only).
- The bundled `pinemhi.ini` turns on `replays=1`, `hiscores=1` and `buyins=1` (`PINemHi/pinemhi.ini#L8-L12`). So the output also contains replay levels and buy-in boards. The binary contains section titles such as "REPLAY SCORE(S)", "BUY-IN HIGHEST SCORES", "GRAND CHAMPION", "HIGHEST SCORES", "TODAY'S HI-SCORE", plus per-game champion titles ("CASTLE CHAMPION", "LOOP CHAMPION"…).
- The binary contains the message **"Not supported rom : "** and usage text (strings).
- PINemHi **3.6.8** (pinemhi.com: "DOWNLOAD LATEST VERSION 3.6.8") is the one vpin-studio ships (`vps:resources/scoringdb.json#L2`). Its exe lists **1,560** `.nv` names against 1,244 in 1.3.1. **317** names are in 3.6.8 only, for example `acd_170`, `acd_170h`, `mtl_180`, `mtl_180h`, `im_183`/`im_186`, `smanve_101`, `avs_170c`, `bdk_294c`, `csi_240`-era revisions, `afm_11pfx`, `agent777`, `bcats_tcm` and many `*fp` / `*f` / `*g` language or "free play" variants (diff of the two string lists).

### A3. Output shape and robust extraction

**Facts (output samples)**
- vpin-studio's parser tests keep raw PINemHi-style boards (`vps:vpin-studio-server/src/test/java/de/mephisto/vpin/server/highscores/HighscoreParserTest.java#L16-L190`). RAW3 is Medieval Madness and uses the same section titles as the 1.3.1 binary. They show:
  - a **section title** line ("GRAND CHAMPION", "HIGHEST SCORES", "AUTOBOT" then "GRAND CHAMPION" on two lines);
  - a **champion line** without a rank: `SLL      52.000.000`;
  - **ranked lines** in three forms: `1) BRE      44.000.000`, `#1  JOE            250.000.000` and `#10 MT  …`;
  - **stat lines** that are not scores: `CHP   7`, `JCY - 6` followed by "CASTLES DESTROYED", `LON   20 COMBOS`, `LON   5-WAY`, `1) KOP` + "CROWNED FOR THE 1st TIME" + a date;
  - **missing or short initials**: `1)       5.555.555`, `P G`, `A A`, `NF`, and a lone `               0`;
  - **separators** that change with the locale (`.`, `,`).
- vpin-studio's generic parser (`vps:server/highscores/parsing/listadapters/DefaultAdapter.java#L107-L111`):
  - rank `(\d+\)|#\d+|\d+#|\d+\.:)`;
  - initials = the first 3 characters, optional (`???` if empty, `#L133`);
  - score digits in groups of three, with separators `[., ?  �ÿ]`;
  - an optional trailing word (a stat suffix);
  - a blank line ends a section, and duplicate (initials, score) pairs are dropped (`#L188`).
- Its `cleanScore` strips `. , ? ÿ     �` and spaces, with the comment "for french locale replace non-breaking spaces" (`vps:vpin-studio-rest-client/src/main/java/de/mephisto/vpin/restclient/util/ScoreFormatUtil.java#L36-L58`). `scoringdb.json` keeps a whitelist of 22 champion titles (`highscoreTitles`) and 7 ROMs whose titles are not checked (`highscoreSkipTitlesCheck`).

**Inference (extraction rules for us)**
- Normalise each line: map ` `, ` `, `ÿ` and `�` to a space. `ÿ` is CP850's no-break space (0xFF) read as ANSI by `AnsiToTSTRING`, which is what a French Windows is likely to produce. **Verify** the exact characters on the cabinet.
- Keep a line as a score entry when it ends in a number of 4 or more digits (after removing separators), optionally after a rank and up to 3 initials characters. Treat shorter numbers, or a number followed by a word ("20 COMBOS", "- 6"), as **stat lines** and ignore them (CONTEXT: "Only a score counts, not a feat").
- Drop whole sections whose title contains "REPLAY" (replay levels change on their own with auto-replay, not by playing). Keep "BUY-IN" boards only if the product wants them.
- Compare boards as a **multiset of (initials, score) over all kept sections**, not section by section. A new Grand Champion pushes the old one down into "HIGHEST SCORES", which a per-section diff would wrongly count as new.
- Reject a board whose only content is "Not supported rom : …" or a usage text. With 1.3.1 these come back with `success: true` (A1). **Verify** the exact text.

### A4. Main failure modes for ROM tables (Fact unless marked)

- **ROM unknown to 1.3.1** (newer revisions, A2): "Not supported rom" output (Inference from strings, **Verify**).
- **Ambiguous or missing `.nv`**: several versions of a ROM played on the PC and no `rom` field set, so nothing is read (`HighScores.cpp#L414-L436`, `#L501-L517`). The fix is to set the ROM in Game Details.
- **Wrong `.nv` for a ROM-less table**: the fuzzy title match can bind an EM or original table to an existing `.nv` of a similarly named SS game. PinballY never checks `tableType` there (`HighScores.cpp#L454-L519`; Inference that a real collision happens).
- **NVOffset tables**: several table versions share one ROM, and `core.vbs` swaps `rom vN.nv` into `rom.nv` when the table starts (`vpx@644890c:src/scripts/core.vbs#L3148-L3180`). Before the Play, PinballY reads the board of whichever version ran last (Inference). vpin-studio handles this case explicitly (`vps:server/vpx/FolderLookupService.java#L354-L393`).
- **PinMAME plugin (VPX 10.8.1)**: it prefers a `pinmame/` folder next to the table (`vpx@644890c:plugins/pinmame/PinMAMEPlugin.cpp#L322-L345`; `docs/FileLayout.md#L92-L98`). An `.nv` stored there is outside the registry folder PinballY reads (Inference).
- **Kill or timeout** before VPinMAME stops: the `.nv` is not updated (section C).

### A5. Running a newer PINemHi from the add-on

**Facts**
- 3.6.8 strings: "Supports almost all top 5 Hiscores from VPREG.stg", "Supports some special Hiscores from VPREG.stg", a `USER` path in `[paths]`, the usage line "PINemHi <romname> displays all the high-scores for that game(rom) for vpinmame or vpreg.stg", and a shell-out `cmd /C .\7z\7z.exe e -y "<…>VPReg.stg" "<name>/*" -o.\pinemhi_temp`. It reads keys such as `HighScore…Name`, `HSName`/`HSPoints`, `StatName`/`StatScore`, `SpecialHighScore`, `WaffleScore`, and per-table keys for storages like `scarface`, `gameofthrones`, `matrix`, `gotg_2020`, `mmunsters`, `b66_orig`, `aerosmith`, `strangerthings4`.
- vpin-studio's `pinemhi.ini` has `USER=…\user\` (`vps:resources/pinemhi/pinemhi.ini#L1-L4`). Its install notes say "The user path is for games that use no rom" (`vps:resources/pinemhi/PINemHi LeaderBoard installation and config.txt#L41-L43`).
- pinemhi.com/code.php lists 46 originals (Pulp Fiction, Scarface, Munsters, Dune…) with "Tablescript code for PINemHi Support", "ONLY USE THESE CODE SNIPPETS WHEN RUNNING PINEMHI VERSION 3.6.7 OR ABOVE" and "Check that you have the romsub.exe in your tables directory". I could not see what the snippets do.
- PinballY only runs PINemHi when an `.nv` exists (A1), so a drop-in 3.6.8 would never be asked about ROM-less tables. PinballY reads the version with `\bversion\s+([\d.]+)` (`PlayfieldView.cpp#L8282-L8285`). PINemHi is bundled "with the author's permission" (`Help/HighScores.html` § part I), so this pack cannot ship it.
- Ways to run a program from JS: `ShellExecuteW` through `dllImport` (fire-and-forget), or `CreateProcess` (`Help/RunProgramExample.html`; `docs/pinbally/pinbally-examples.md` §2.9). `WScript.Shell` through `createAutomationObject` would also work (Inference: `.Run(cmd, 0, false)` hides the window and does not wait; the output goes through a temp file that a `setTimeout` loop polls).

**Inference**
- **Drop-in**: replace the files in `<PinballY>\PINemHi\` with 3.6.8. That needs no code and adds the 317 ROMs, but nothing for ROM-less tables. **Checked on the cabinet (2026-10-11, prototype branch `prototype/high-scores-probe`)**: the output format is the same, and the board rule reads it unchanged. But the 3.6.8 `pinemhi.ini` has no `[romfind]` section: it ships the list in a separate `romfind.ini`, which PinballY never reads (`HighScores.cpp` loads `[romfind]` from `PINemHi\PINemHi.ini` only). With a plain drop-in, every table without a `rom` field loses its ROM, and no board is read at all. Fix: append `romfind.ini` to `pinemhi.ini`, set `USER=` to the VPX `User` folder, and restart PinballY.
- **Add-on fallback**: on `highscoresready` with a failed or "Not supported" result, run a user-installed 3.6.8 hidden, then `setHighScores(lines)`. For ROM-less tables the add-on must already know the `VPReg` storage name (B4) and have `7z\7z.exe` beside PINemHi. That covers the same ground as our own `VPReg` reader (B5), with an extra external dependency. It is worth it for the ROM gap only.

### A6. Reading raw `.nv` files ourselves

**Facts**: the community map project documents `.nv` layouts in 391 JSON maps covering 1,530 ROM ids (`index.json`), "beta quality", with BCD and nibble encodings, under the ODbL/DbCL licence (`pinmame-nvram-maps:README.md#L1-L30`, `#L69-L80`, `#L150-L175`). VPX's PinMAME plugin and vpin-studio use these maps (`vpx@644890c:plugins/pinmame/Controller.cpp#L183`; `vps:server/highscores/parsing/nvram/NvRamParsingWithParser.java`).
**Inference**: a JS port would mean shipping and updating about 400 maps under a share-alike database licence, and decoding the formats per platform, to recover roughly what PINemHi already gives. **Not realistic** for this pack.

## B. EM and original tables

### B1. Where `SaveValue` data lives, per VPX version (Fact)

| VPX | Windows file | Code |
|---|---|---|
| 10.7.4 | `<VPX folder>\User\VPReg.stg` | `vpx@v10.7.4-433-a4c3788:pintable.cpp#L497-L609` |
| 10.8.0 (current stable) | `<VPX folder>\user\VPReg.stg` | `vpx@v10.8.0-2051-28dd6c3:src/parts/pintable.cpp#L620-L700` |
| 10.8.1 pre-releases up to 3788 | `<VPX folder>\user\VPReg.stg`. Standalone builds use `VPReg.ini` in the preferences folder or in the `Standalone.VPRegPath` setting | `vpx@v10.8.1-3788-2151290:src/parts/pintable.cpp#L574-L748` |
| 10.8.1-5436 (pre-release 2026-08-21) | `VPReg.stg` in the table's "user" folder from `FileLocator` (below) | `vpx@v10.8.1-5436-af26b2d93:src/core/ScriptGlobalTable.cpp#L505-L651` |
| master since `f30d525` (2026-08-30, "Unify VPReg.ini use for all platforms"), no release yet | **`VPReg.ini`** in that same folder. A missing value falls back to the legacy `VPReg.stg` | `vpx@644890c:src/core/ScriptGlobalTable.cpp#L527-L623` |

- `FileLocator` (10.8.1-5436 and master): the layout is "AppPrefData" when `VPinballX.ini` sits in the preferences folder (`%APPDATA%\VPinballX\10.8\`), and "AppOnly" when it sits in the VPX folder (`vpx@644890c:src/core/FileLocator.cpp#L195-L206`).
  - **AppOnly**: the user folder is `<VPX>\user`.
  - **AppPrefData**: it is `<folder of the .vpx>\user`, created on the first write. A read falls back to the AppOnly path while that folder does not exist yet (`#L267-L363`, the fallback at `#L315-L322`; `docs/FileLayout.md#L114-L116`; `docs/Changelog.txt#L20-L34`).
- `UserDirectory` (where text-file tables write) follows the same rules: `<VPX>\User\` in 10.7.4 (`pintable.cpp#L460-L466`), and `<VPX>\user\`, else `<table path>\user\`, in 10.8.0 (`#L461-L469`). In 10.8.1-5436 and later it comes from `FileLocator` (`ScriptGlobalTable.cpp#L370-L376` at 5436).

### B2. Format (Fact)

- **`.stg`**: one sub-storage per first `SaveValue` argument (the "table name"), and one stream per value name. A value is the UTF-16LE text of the variant converted with LCID 0x409, with no terminator. Every call opens the file `STGM_SHARE_EXCLUSIVE`, writes, commits and closes it (`vpx@v10.7.4…:pintable.cpp#L497-L553`; `BstrFromVariant` `vpx@644890c:src/core/ScriptGlobalTable.cpp#L488-L512`). An unknown value reads back as `""`, including when the file cannot be opened (`pintable.cpp#L561-L583`).
- **`.ini`** (master): sections = table names, keys = value names. The whole file is read and rewritten on each `SaveValue`, and names match case-insensitively (`ScriptGlobalTable.cpp#L514-L552`).
- vpin-studio reads the `.stg` streams as bytes, decodes them as UTF-8 and strips NULs, which works because the values are ASCII (`vps:server/highscores/parsing/vpreg/adapters/VPRegHighscoreAdapterImpl.java#L15-L39`).

### B3. What tables actually do

**Facts (corpus, heuristic counts)**: 113 of the 284 scripts are ROM-less.
- **42 EM-era (year < 1980)**: 34 write text files in `UserDirectory`, 7 use `SaveValue` high score keys, 1 neither.
- **71 originals or other**: 51 use `SaveValue` only, 5 both, 13 text files, 2 neither.
- Among the 63 ROM-less scripts that save high score keys:
  - 47 use **`HighScoreN` + `HighScoreNName`** (2 more spell it `"HighScore"&i&"Name"`);
  - 6 use `HighScore`/`hiscore` + **`HSA1..3`** letters;
  - the rest are one-offs (`hiscore` + `scoreN`, `HiScore` + `InitialN` + `ScoreN`, `Track…Score`…).
- The table-name argument is a script constant: `TableName` (30), `cGameName` (22), others (11). It is neither the `.vpx` file name nor the PinballY title.
- Only 3 scripts write a `.PinballYHighScores` file.

**Facts (examples)**
- JPSalas original *Pulp Fiction*: `Const cGameName = "pulp fiction"`, then `SaveValue cGameName, "HighScore1".."HighScore4"`, `"HighScore1Name"…`, `"Credits"`, `"TotalGamesPlayed"`. `Savehs` is called **only from `Table1_Exit`** and from the reset routine (`vss:Pulp Fiction 3.1/pulp_fiction.vbs#L83`, `#L496-L500`, `#L1820-L1842`).
- loserman76-style EM *2001 (Gottlieb 1971)*: `HSFileName="2001_1971VPX.txt"` in `UserDirectory`. Its lines are `0`, credits, balls per game, tilt option, target setting, replay level, 5 scores, 5 initials. It is written in `Table1_exit` and after the end-of-game sort (`vss:2001 (Gottlieb 1971) v0.99a/…vbs#L184`, `#L513-L514`, `#L2040-L2050`, `#L2173-L2196`).
- *Heat Wave (Williams 1964)*: `HeatWave_1964.txt` (5 scores, 5 initials, 15 letter codes, settings). With `cPinballY = 1` it also writes `<parent of User>\Tables\Heat Wave (Williams 1964).PinballYHighScores`, with `2` into `User\` (this copy has `2`). Only the first location is one PinballY reads, and only if the `.vpx` sits there under that exact name (`vss:HeatWave(Williams1964)1.0/Heat Wave (Williams 1964).vbs#L38-L46`, `#L1847-L1910`).
- vpin-studio needs **15 `VPReg` adapters**, 8 of them hard-coded to specific table storages (`madscientist`, `RaygunRunner`, `Heatw`, `SpEyes`, `JungleQueen`, `Gulfstream`/`Mariner`/`AirAces`/`SeaRay`) (`vps:server/highscores/parsing/vpreg/VPRegFile.java#L37-L53`). It also keeps 76 ignored storages (`scoringdb.json#L440`) and **44 text-file parser configs** covering 65 named files, where scores start at line 0 to 7+ (`scoringdb.json#L14`; `…/text/adapters/AlteringScoreInitialsBlocksAdapter.java`). The conventions are **per author, not standardised**.

### B4. How vpin-studio maps a table to its entry (Fact)

- It scans the table script for `cGameName`/`GameName`, `TableName`/`B2STableName` and `HSFileName`, or any `"….txt"` literal (`vps:server/util/VPXFileScanner.java#L39-L53`, `#L186-L215`, `#L390-L397`).
- The `.stg` sub-storage must equal the ROM name, ROM + `_VPX`, or the table name, case-insensitively (`VPRegFile.java#L341-L364`), with 19 manual overrides (`scoringdb.json` `highscoreMappings`).
- It looks in `<VPX>\User\VPReg.stg`, then in `<table folder>\user\VPReg.stg` and its parent (`vps:server/vpx/FolderLookupService.java#L283-L322`).
- The order it tries is `.nv` (PINemHi and maps) → `VPReg` → `*_glf.ini` → text file (`vps:server/highscores/HighscoreResolver.java#L175-L185`).
- It has no `VPReg.ini` support yet (no match in the repo).

**Inference**: PinballY's JS has no access to the table script, which sits inside the `.vpx` compound file. Two ways remain:
- a mapping typed in by hand (for example the PinballY `rom` field set to the storage name; that is harmless, because PinballY just finds no `.nv`, `HighScores.cpp#L339-L361`, `#L527-L534`);
- **discovering it from what changed**: snapshot every storage and value before the Play, diff after it. The table's own storage is the one whose `TotalGamesPlayed`, `Credits` or `HighScoreN` moved.

### B5. Reading these files from a PinballY add-on

**Facts**
- Text: `Scripting.FileSystemObject` + `ADODB.Stream` already read UTF-8 files in this repo (`common/core/pinbally_host.js#L32-L79`, `common/core/config.js#L117-L128`). That covers `VPReg.ini` and the EM `.txt` files.
- COM automation cannot pass arrays (`Help/OLEAutomation.html` § Limitations "Arrays"; `Help/Variant.html`: `VT_ARRAY` "Not supported"). So `ADODB.Stream` in binary mode cannot hand bytes to JS (Inference).
- `dllImport` can define COM interfaces in IDL-like syntax, with `COMPointer` out-parameters and `IID_PPV_ARGS` handling (`Help/DllImport.html` § "COM and OLE objects"; `Help/COMPointer.html`). It can fill `Uint8Array` buffers, and it reads wide strings with `NativePointer.toStringZ()` (`Help/DllImport.html`, `Help/NativePointer.html`). Only `IUnknown` is predefined. Mistakes can crash PinballY (`Help/DllImport.html`), and a definition string must not end with a `//` comment (`.claude/rules/conventions.md`, CParser C6).

**Inference (two technical routes)**
1. **ole32 route**: `StgOpenStorage(path, null, STGM_READ|STGM_SHARE_DENY_WRITE, …)`, then define `IStorage` (18 methods, in SDK order), `IStream` (`Read`, `Stat`) and `IEnumSTATSTG` + the `STATSTG` struct to list storage names. The `pwcsName` strings must be freed with `CoTaskMemFree`. This reuses Windows' own parser, but every vtable slot must be exact.
2. **Bytes + JS parser**: read the file into a `Uint8Array` (kernel32 `CreateFileW` with `FILE_SHARE_READ|FILE_SHARE_WRITE` + `ReadFile`), then parse the compound file format in plain JS (header, FAT, mini-FAT, directory). The parser runs under `node --test` behind the host seam. vpin-studio's MIT test files (`vps:testsystem/vPinball/VisualPinball/User/VPReg*.stg`) could be fixtures. The native surface is two simple functions.

- **Never open `VPReg.stg` while VPX runs.** VPX opens it `STGM_SHARE_EXCLUSIVE` on every call, and a failed open makes `LoadValue` return `""` (B2). A table that loads its board while we hold the file would start from defaults, then save those defaults on exit. Read before the launch (in the `command`/`prelaunch` handlers, synchronously, then close), and after `gameover`.
- Timing for a whole-file snapshot (a few hundred streams) is unknown: **Verify**.

### B6. PINemHi 3.6.8 and `VPReg`

See A5. It reads one `USER` folder (`…\user\VPReg.stg`) by storage name, through 7-Zip (Inference from strings). It knows neither the per-table-folder layout of 10.8.1 AppPrefData nor `VPReg.ini`.

## C. Timing

**Facts (VPX and PinMAME side)**
- On quit, `Player::ShutdownTableSession` fires the table's `_Exit` script event, then stops the script engine (`vpx@644890c:src/core/player.cpp#L1000-L1030`). If a table has no `_Exit`, `core.vbs` builds one that runs `Controller.Pause = False:Controller.Stop` (`src/scripts/core.vbs#L2494`).
- `Controller.Stop` waits for the emulation thread to end (`pinmame:src/win32com/Controller.cpp#L377-L394`). PinMAME writes the `.nv` **only after the emulation loop returns** (`pinmame:src/mame.c#L598-L622`). So the new `.nv` is on disk before the VPX process exits, provided shutdown completes.
- `SaveValue` writes synchronously on each call (B2). Text files are written whenever the script runs its save routine. Several tables (Pulp Fiction, 2001) save in `Table1_Exit`, and Pulp Fiction saves **only** there (B3).

**Facts (PinballY side)**
- Launch: `PlayGame` saves PinballY's files, then **clears the game's cached board** (`ClearCachedHighScores`: lines cleared, status `Init`), then queues the launch, then fires `prelaunch` (`PlayfieldView.cpp#L5536-L5542`, `#L5615`; `GameList.h#L645-L654`; `Help/HighScoresEvent.html` § "When are high scores requested?").
- Exit: the monitor thread waits on the process handle. It sends `PFVMsgGameOver`, which updates the play time and fires JS `gameover` (`Application.cpp#L5157-L5240`; `PlayfieldView.cpp#L10456-L10490`). Then it sends `PFVMsgLaunchThreadExit`: `EndRunningGameMode` → `SyncPlayfield(SyncEndGame)` → `LoadIncomingPlayfieldMedia` → `RequestHighScores(game, true)`, and fires `postlaunch` (`Application.cpp#L2614-L2627`; `PlayfieldView.cpp#L10495-L10508`, `#L10129-L10162`, `#L11734-L11757`, `#L8865`). That fresh request fires `highscoresrequest`, runs PINemHi, then fires `highscoresready`. A script that cancels `mediasyncload` skips it (`#L8759-L8760`).
- **Exit Game from PinballY** (`Application.cpp#L1977-L2232`; `Help/SystemOptions.html` § Terminate by, Timeout):
  - **Kill Process**: `TerminateProcess` at once.
  - **Close Window** (default) or **PinSim::FrontEndControls**: a close request, then `TerminateProcess` once **`closeWindowTimeout`** runs out (default **2500 ms**).
  - After a Close Game event the monitor waits at most 5 s more, then reports game over even if the process is still alive (`Application.cpp#L5175-L5212`).
  - `terminateBy` and `closeWindowTimeout` can be read from `game.system` and overridden for one launch through `prelaunch` `overrides` (`Help/GameSysInfo.html` `terminateBy`, `closeWindowTimeout`; `PlayfieldView.cpp#L2059-L2074`, `#L5615-L5628`; `Help/LaunchEvent.html` § overrides).

**Inference**
- A killed VPX skips `_Exit`. Then the `.nv` is not written, nor any `VPReg` value or text file saved only at exit. The "after" board equals the "before" board, so a real High Score is lost, but none is invented. A slow shutdown (B2S, PUP, DMD) longer than 2.5 s gives the same result.
- **Stale-cache race**: if a PINemHi request for the game is still in flight at launch (fast wheel scrolling queues requests), its result lands during the Play, marks the board `Received` and stores the *pre-Play* board. The post-exit request then returns it from cache (`PlayfieldView.cpp#L8234-L8237`, `#L8301-L8313`). Calling `setHighScores(null)` after `gameover` and before reading forces a fresh run (`#L2429-L2442`).
- A `getHighScores()` in `prelaunch` gives a true pre-Play board, because the cache was just cleared and VPinMAME has not written anything yet. Its result arrives during the Play.

## D. Coverage estimate (Inference)

| Kind | Native PinballY | With extra readers | Main failure modes |
|---|---|---|---|
| 1. SS with ROM | **High**: every ROM in the 1,240 known to 1.3.1 whose `.nv` resolves. Likely most classic WPC, System 11, Bally/Stern 80s, Data East, Sega and early Stern; misses the newer revisions in A2 | +317 ROM ids with 3.6.8 | unsupported ROM (`success: true`), ambiguous or missing `.nv` (no `rom` field), NVOffset swaps, PinMAME-plugin `pinmame/nvram` folder, kill before `Controller.Stop`, locale separators, replay sections, high score auto-reset (defaults look new), first read with no earlier board |
| 2. EM, no ROM | **About 0**: only tables that write `.pinballyHighScores` next to the `.vpx`; a fuzzy title match may even show a wrong SS board | text-file reader: most loserman76/Bord-style tables (34 of 42 in the corpus); `VPReg` reader: about 7 of 42 | per-author line layouts, settings lines (credits change every game), file↔table mapping, 10.8.1 moves `User\` into the table folder, saves only at exit |
| 3. Originals, no ROM | **About 0** | `VPReg` reader: about 56 of 71 in the corpus (47 of 63 on the `HighScoreN`/`HighScoreNName` family); text: about 18 of 71 | storage name unknown to PinballY, one-off keys and "special" boards, `VPReg.ini` coming, never read while VPX runs |
| FP | 1.3.1 says it supports all FP top-10 tables through `.fpram` | none | not researched (when FP writes `.fpram`) |

The corpus percentages are a proxy, not the cabinet. One prototype pass over the 100 games gives the real numbers (below).

## E. Options

| Option | Coverage | Effort | Risks |
|---|---|---|---|
| **1. PinballY board only**: capture the board before the Play (last `highscoresready` or a `prelaunch` `getHighScores()`), `setHighScores(null)` + `getHighScores()` after `gameover`, a pure-JS PINemHi text parser, a multiset diff | Kind 1 only, plus the rare `.pinballyHighScores` tables | Small: one parser and the event plumbing, all `node --test`-able | "Not supported" text, stale cache, kill or timeout, locale characters, replay and stat lines, false "new" entries after a high score reset or on the first read |
| **2. Option 1 + newer PINemHi**: (a) the user drops 3.6.8 into `<PinballY>\PINemHi\`, or (b) the add-on runs a user-installed 3.6.8 hidden as a fallback and calls `setHighScores()` | Kind 1 +317 ROM ids; ROM-less only with (b) plus a known storage name and `7z.exe` | (a) none (user step); (b) medium (process + temp-file polling) | cannot be bundled, .NET 3.5, compatibility of (a) with PinballY's ini rewrite unknown, slower reads, version drift |
| **3. Option 1 + `VPReg` reader**: snapshot every storage before and after, find the table's storage by what changed (remembered per game), read `HighScoreN`/`HighScoreNName` and `HSA` families, fall back to "new numbers"; look in `<VPX>\User`, `<table folder>\user` and `VPReg.ini` | Kind 1 + most originals + the EM minority on `VPReg` | Medium–large: ole32 `IStorage` through `dllImport`, or byte reads + a JS compound-file parser (testable) | a crash from a wrong `dllImport` definition, a share collision with VPX (which could reset a table's board), one-off keys, the first Play needed to learn the storage |
| **4. Option 3 + `User`-folder text reader**: files modified during the Play in the user folder(s), detect "N numbers followed by N initials" blocks, diff | Adds most EM tables | Medium on top of 3 | layouts vary (vpin-studio keeps 44 configs), settings mistaken for scores, several files touched in one Play |

All options share the same rules: read before the launch and after `gameover`; treat the first board ever read as belonging to no one (CONTEXT); and accept that a killed or timed-out VPX loses that Play's High Score.

## Prototype on the cabinet: what to log

One throwaway add-on, every entry through `logfile.log` with a single string, with JSON of the values and `\uXXXX` escapes for non-ASCII characters:

1. **Inventory pass** (no play needed): for each game in `gameList`, run `setHighScores(null)` then `getHighScores()` one after the other. Log:
   - `title`, `tableType`, `system.systemClass`, `system.terminateBy`, `system.closeWindowTimeout`, `system.nvramPath`;
   - `resolveROM()` (`vpmRom`, `dofRom`, `nvramPath`) and `resolveGameFile().path`;
   - Promise resolved or rejected, `.source`, line count, and every line escaped.
2. Also log every `highscoresready` event (`success`, `source`, line count) during that pass, to check the `source` quirks of A1.
3. **Exact text** for an unsupported ROM and for a missing `.nv`, and the character codes of the thousands separator in a score line.
4. **VPX layout**:
   - does `<VPX>\VPinballX.ini` exist, and does `%APPDATA%\VPinballX\10.8\VPinballX.ini`;
   - the VPX version (file version of `VPinballX*.exe`);
   - the files in `<VPX>\User\` and `<VPX>\user\` (name, size, `DateLastModified`);
   - for each table folder: `user\VPReg.stg`, `user\VPReg.ini`, `pinmame\nvram\`.
5. **Around three Plays** (one ROM table, one EM, one original), exiting once through the PinballY Exit button and once from inside VPX. Log:
   - `Date.now()` at `command` (PlayGame), `prelaunch`, `gamestarted`, `gameover`, `postlaunch`, each `highscoresrequest` and each `highscoresready` (with source and success);
   - the board before and after;
   - the `DateLastModified` of the `.nv`, of `VPReg.stg` and of every user-folder file modified since `prelaunch`;
   - the `TableLaunchLogging` lines in `PinballY.log` (killed or not).
6. **`VPReg.stg` reader spike**: open, list root storage names, read all streams of one storage. Log the counts and the ms spent, and whether opening while VPX runs fails.
7. **Optional**: `createAutomationObject("WScript.Shell")` works, `.Run(cmd, 0, false)` shows no window, and PINemHi 3.6.8 run time on one `.nv` and on one storage name.

## Open questions

1. Does PINemHi 1.3.1 exit normally after "Not supported rom : …", so that PinballY reports `success: true`? What exact text does it print? (A1, A3)
2. Which thousands separator reaches JS on the French cabinet (` `, ` `, `ÿ`, `�`, `.`)? (A3)
3. Which VPX build and file layout does the cabinet run, and where are `VPReg.stg` and the EM text files really written? (B1)
4. ~~Does a drop-in PINemHi 3.6.8 work inside PinballY's folder?~~ Yes, once `romfind.ini` is appended to `pinemhi.ini` (A5). Still open: does the 3.6.8 zip ship `7z\7z.exe`?
5. Which `dllImport` route is safer in practice: the `IStorage` vtable, or `ReadFile` + a JS compound-file parser? How long does a whole-file snapshot take? (B5)
6. How long does a normal VPX shutdown take on the cabinet (B2S, PUP)? Does it stay under `closeWindowTimeout`? (C)
7. Product decisions, not API questions: do buy-in boards count? How should a high score auto-reset be detected (many "new" factory entries at once)? Should the first read of a table that never had a board give its scores to no one, as the CONTEXT rule implies? (A3, D)
8. Future Pinball: when does FP write `.fpram`? Are there FP tables on the cabinet at all? (D)
