# Existing tools that read virtual-pinball high scores (vpin-studio and community)

Date: 2026-10-11. Builds on `docs/research/high-scores.md` (2026-10-10, "the earlier research"); facts already there are not repeated, only referenced. vpxtool is covered in `vpxtool.md` next to this file.

**Fact** = read in source code or a primary page (cited). **Inference** = my reading, not run. **Ran** = I executed it here on sample files.

## Sources read (2026-10-11)

| Tag | Source | Version / date |
|---|---|---|
| `vps:` | `github.com/syd711/vpin-studio`, `vpin-studio-server/src/main/java/de/mephisto/vpin/server/` | main `c0af9d3` (2026-10-11), pom 5.4.3; release 5.4.3 published 2026-10-09. MIT (`LICENSE`, "Copyright (c) 2022 syd711") |
| `jnv:` | `github.com/syd711/java-pinmame-nvmaps` (the `net.nvrams` library vpin-studio depends on, `vpin-studio-server/pom.xml#L341-L345`) | `f3de6ad` (2026-05-22), MIT ("Copyright (c) 2026 Matthias Faust") |
| `maps:` | `github.com/tomlogic/pinmame-nvram-maps`, **renamed `pinball-memory-maps` in August 2026** (README#L64-L67) | `68c1b33` (2026-10-02) |
| `sh:` | `github.com/superhac/pinmame-score-parser` | `f1fac1a` (2026-07-12), **no licence file** |
| `pbs:` | `github.com/magnuspihl/pinball-scores` (C# Windows service) | `afdb90d` (2026-10-02), **no licence file** |
| PINemHi | 3.6.8 files shipped in `vps:resources/pinemhi/` (incl. `PINemHi LeaderBoard installation and config.txt`), `pinemhi.com`, `pinemhi.com/code.php` + `code_show.php` | site says "DOWNLOAD LATEST VERSION 3.6.8" |
| Others | nailbuster wiki `high_scores_setup` (last modified 2019-04-03); LaunchBox plugin page 3163 (v2.1.2, 2025-04-22); `github.com/apaxson/vPinball-Highscore-Export` (GPL-3.0, 2026-08/09); GitHub API metadata of `tomlogic/py-pinmame-nvmaps`, `francisdb/pinmame-nvram`, npm `cfb` | |

Not reached: VPForums and GameEx forum threads (HTTP 403 again), the 7-Zip VPReg thread itself. Its format claims are checked against code and sample files instead (section 6).

The `deep-research/references/researcher.md` file named in the brief does not exist in this environment; I followed the project's usual Fact/Inference convention instead.

## 1. Summary: what each tool already solves

| Tool | ROM `.nv` | VPReg (`.stg`) | VPReg.ini (VPX 10.8.1+) | EM/original text files | Structured (pos/initials/score) | "Who set it" | Licence | Reusable by us |
|---|---|---|---|---|---|---|---|---|
| **vpin-studio** 5.4.3 | yes: PINemHi 3.6.8 → tomlogic maps → superhac maps, in that order | yes (Apache POI, 15 adapters) | **no** | yes (44 parser configs, 65 file names) + GLF `*_glf.ini` | yes | **by initials only** (+ "???" → admin player) | MIT | **logic + `scoringdb.json` data**: yes (MIT). Java + Spring + POI: not directly |
| **java-pinmame-nvmaps** | yes (3 back-ends) | no | no | no | yes | no | MIT | parser regexes, coverage table `allroms.csv` |
| **PINemHi 3.6.8** | yes, 1,559 ROMs | "almost all top 5" via 7-Zip | no | only via table-script patches (`.pmh`) | text only | LeaderBoard: online account (name + code), player 1 score of last game | freeware, no licence text found; redistributed by PinballY "with permission" | as an external exe the user installs |
| **pinball-memory-maps** | 385 maps / 1,531 ROM ids (index), "beta" | no | no | no | yes (JSON offsets) | no | ODbL + DbCL (maps), LGPL-3.0 (tools) | data only, share-alike |
| **superhac score parser** | 247 ROM entries | no | no | "certain .ini" files | yes | no | none (all rights reserved) | **no** |
| **pinball-scores** (C#) | maps + checksum validation | yes (OpenMcdf, 3 hand maps) | no | no | yes | API server dedups `(table, category, initials, value)` | none | ideas only |
| PinUP Popper (nailbuster guide) | PINemHi 1.3.1 → PNG | no | no | "PostIT" `.txt` (Nov-2018 format) | no (image) | no | — | no |
| LaunchBox "Top Scores" plugin | PINemHi | rom-less via PINemHi | no | — | display | PINemHi LeaderBoard | none stated | no |
| PinballX | no built-in reader found | | | | | | | no |

Bottom line (Inference): **nobody ships an off-the-shelf "which player of this cabinet set this new high score" feature beyond initials matching.** vpin-studio is the most complete reader and is MIT, so its *rules and data* can be ported; its NVRAM path still goes through PINemHi, which PinballY already runs for us.

## 2. vpin-studio: how high scores are read

### 2.1 Pipeline (Fact)

`HighscoreResolver.readHighscore` (`vps:highscores/HighscoreResolver.java#L152-L212`):
1. Future Pinball → `.fpram` through PINemHi (`#L340-L361`).
2. Otherwise the key is `game.getRom()`, else `game.getTableName()` (both come from scanning the table script, earlier research B4). No key → "No rom or table name found".
3. Order: **NVRAM → VPReg → `*_glf.ini` → text file**. Comment: "always check NV ram first, the table might store additional data into the VPReg.stg too" (`#L175-L185`).
4. Each reader returns a **"raw" text in PINemHi style** (title lines, `#1 ABC   1.234.567`); all later steps parse that one format. VPReg and ini readers synthesise it (`DefaultIniHighscoreFileAdapter.java` builds `HIGHEST SCORES\n#1 NAME   value`).

NVRAM (`parsing/nvram/RamOutputToScoreTextConverter.java`, `NvRamParsingConfiguration.java#L26-L47`):
- Three registered back-ends, tried in order: **PINemHi** (runs `cmd /c PINemHi.exe <rom>.nv` in its folder, after rewriting `[paths] VP=` in `pinemhi.ini`, `jnv:src/main/java/net/nvrams/mapping/pinemhi/PinemhiRamParser.java#L170-L263`), then **tomlogic maps** (`resources/maps/`), then **superhac** (`resources/superhac/roms.json`).
- Supported ROM list for PINemHi comes from **`PINemHi.exe -lr`** at startup (`PinemhiRamParser.java#L76-L85`). Unsupported → "The NV ram file "x.nv" is currently not supported." and no PINemHi call (`HighscoreResolver.java#L313-L318`). This avoids the "Not supported rom" text problem of the earlier research A3.
- NVOffset files (`rom v2.nv`): the converter **copies the offset file over `rom.nv`, parses, then restores** (`RamOutputToScoreTextConverter.java#L54-L118`). Inference: unsafe while VPX runs; we should not copy that.
- Per-ROM output fix-ups exist for only 4 ROMs (`monopoly`, `godzilla`, `punchy`, `wrldtou2`) plus `tf_180` (merges Autobot/Decepticon boards, keeps 10) (`PinemhiRamParser.java#L63-L73`, `#L114-L125`).

VPReg (`parsing/vpreg/VPRegFile.java`):
- **Apache POI `POIFSFileSystem`** 5.4.0 (`VPRegFile.java#L12`, `#L69`; `vpin-studio-server/pom.xml#L59`, `#L348-L351`).
- 15 adapters (list in earlier research B3). Value decoding: bytes → `new String(bytes, UTF_8)` → strip `\0` → for scores, cut at the first `.` (`adapters/VPRegHighscoreAdapterImpl.java#L15-L39`). Works because values are ASCII UTF-16LE (section 6).
  - Bug (Fact, code): the `,` loop uses `indexOf(".")`, so a score stream containing `,` but no `.` gives `substring(0, -1)` → exception (`VPRegHighscoreAdapterImpl.java#L33-L35`). Rare, since VPX writes with LCID 0x409.
- Single-key fallbacks: `hiscore`, `HighScore`, `HiScore`, `DBHiScore`, `Highscore(n)`, `HighScore(n)` (`#L42-L66`).
- Still **no `VPReg.ini` support** (no match for `vpreg.ini` anywhere in the repo at `c0af9d3`), although the repo carries `VPX-10.8.1-FileLayout.md` (user/VPReg.stg per table folder).

Text files (`parsing/text/`, 1,019 Java lines) driven by `resources/scoringdb.json` `highscoreTextParsers`: 44 entries, 65 named files. Parser kinds (counted): `AlteringScoreInitialsBlocks` 27, `SinglePlayer` 7, `TwoPlayers` 4, `AlteringScoreInitialsLines` 3, `ThreePlayers` 1, `FourPlayers` 1, `AlteringScoreInitialsBlocksWithOffset` 1. An entry matches by **file name**, or, when it has no `fileNames`, **by exact line count** (`AlteringScoreInitialsBlocksAdapter.java#isApplicable`). File lookup: script's `HSFileName`, else `<TableName>.txt`, else `highscoreMappings[].textFile` (`HighscoreResolver.java#L214-L238`).

GLF ini (new since the earlier research): `<rom or tableName>_glf.ini` **next to the `.vpx`**, `[HighScores] score_N_label/name/value` (`HighscoreResolver.java#L89-L104`; `parsing/ini/adapters/DefaultIniHighscoreFileAdapter.java`). Inference: written by tables built on the VPX "Game Logic Framework".

### 2.2 Normalising raw lines into (position, initials, score) (Fact)

Two copies of the same parser: `jnv:RawScoreParser.java` ("Copied from VpinStudio") and `vps:parsing/listadapters/DefaultAdapter.java` (202 lines).
- Rank prefix: `(\d+\)|#\d+|\d+#|\d+,|\d+\.:) +` (`RawScoreParser.java#L103`).
- Score part: optional initials `[ ?/+\-a-zA-Z0-9\u0000]{3,}`, digits in groups of three with separators `[.,?  �ÿ]`, optional `.d` decimal, optional trailing word = "suffix" (`#L104`).
- A line after a title without a rank = "titled score" (champion); it is kept **only if the title is in the 22-title whitelist** (`scoringdb.json highscoreTitles`), unless the ROM is in `highscoreSkipTitlesCheck` (7 ROMs) (`#L66-L73`).
- **Parsing stops at the first blank line once 3 scores were found** (unless `parseAll`) (`#L43-L57`). So replay/buy-in/stat sections after the main board are ignored by construction. This is simpler than our planned "drop REPLAY sections" rule, and probably good enough.
- `cleanScore` strips `. , ? ÿ NBSP NNBSP U+FFFD space` (`#L187-L197`).
- After parsing, `ScoreListFactory.create` drops duplicate (score, initials case-insensitive) pairs and **renumbers positions 1..n across champion + ranked entries** (`parsing/ScoreListFactory.java#create`). PinemhiRamParser additionally drops score 0 duplicates (`#L155-L166`).

### 2.3 Detecting a new high score after a game (Fact)

Triggers:
- **PinballY integration**: vpin-studio writes `SystemN.RunBefore` / `SystemN.RunAfter` into PinballY's `settings.txt` as `[NOWAIT HIDE]curl -X POST http://localhost:<port>/service/gameLaunch|gameExit --data-urlencode "table=[TABLEPATH]\[TABLEFILE]" ... & :: Added by VPin Studio` (`frontend/pinbally/PinballYConnector.java#L504-L548`). So PinballY support goes through a local REST server, not through PinballY's JS.
- On exit: sleep until **6 s** after the event (`EXIT_DELAY = 6000`), then `scanScore` (`listeners/DefaultTableAndFrontendStatusChangeListenerImpl.java#L37`, `#L135-L156`).
- On launch: also `scanScore` of the launched game, as the "before" board (`#L78`). (A bug: the "rescan last played game" branch rescans `game` instead of `lastGamePlayed`, `#L83-L86`.)
- Since 5.x: **folder watchers** on nvram, VPX `User` and fpRAM folders, debounced 1 s, flushed when the emulator process stops (`highscores/HighscoreMonitoringService.java#L52-L56`, `#L174-L199`). For `VPReg.stg` it **cannot tell which storage changed**, so it rescans every game whose ROM/table name/HS file name matches any storage name (`#L260-L283`).

Diff (`highscores/HighscoreService.java#L512-L636`):
- Stored state per game = last raw text (DB `Highscore`), plus `HighscoreVersion` rows (old raw, new raw, changed position, timestamp).
- **First read ever**: it creates an artificial board of `#n ??? 0` with the same number of entries, so **every initial score is reported as a change**, flagged `initialScore=true` on the event (`#L521-L545`, `HighscoreChangeEvent(..., initialScore, ...)`). Consumers decide what to do with that flag.
- Raw text equal → nothing. Otherwise parse both, and a new entry is "changed" when **no old entry has the same initials and the same score** (`calculateChangedPositions`, `#L680-L705`; `Score.matches`, `Score.java#L135-L139`). This is a multiset-style test, close to what the earlier research proposed, but done per position of the *new* list.
- Filter before firing (`ScoreFilter.java`): empty initials; score < 10 (`UIDefaults.MAX_RESET_SCORE_VALUE = 10`); `???` when no admin player; optional allow-list of known players' initials.

### 2.4 Attributing to players (Fact)

- Players are DB records with **3-letter initials** (and optional Discord / VPin Mania accounts). `getPlayerForInitials` = case-insensitive initials lookup, first match on duplicates, then Discord members (`players/PlayerService.java#L91-L117`).
- A score with initials `???` and > 0 goes to the **"administrative" (default) player** (`parsing/HighscoreParsingService.java#L44-L58`).
- So attribution = "**whoever typed those initials**". No link to who was in front of the cabinet. Competitions ("offline", Discord, iScored, WOVP) read `HighscoreVersion` rows created between the start and end dates (`HighscoreService.getScoresBetween`, `#L274-L296`) and pick a winner by initials (`competitions/CompetitionService.java#L225-L258`).
- Our model (active Profile in PinballY) is different: we know who played, not which initials were typed. vpin-studio offers nothing that maps a Play to a person.

### 2.5 Highscore cards (Fact, brief)

`highscores/cards/` (CardService 486 lines, templates) renders the parsed list into an image per table, stored as frontend media, refreshed on `highscoreUpdated` (`CardService` is a `HighscoreChangeListener`). Display only; no new reading logic.

### 2.6 Portability to our JS (Inference)

| Piece | Java size | JS estimate | Notes |
|---|---|---|---|
| Raw-line parser (`RawScoreParser`) | 197 lines | ~80 lines | regexes copy directly (ChakraCore supports them); add the 22 titles + 7 ROMs list |
| VPReg adapters | 1,033 lines (15 classes) | ~150 lines | most are the same "key pattern N / name pattern N" with a format string; plus a CFB reader (section 6) |
| Text-file adapters + `scoringdb.json` | 1,019 lines + JSON | ~200 lines + copy of the 44 configs | MIT, so the JSON can be vendored with attribution; matching needs the file name (we don't scan scripts) |
| GLF ini | 100 lines | ~30 lines | trivial |
| Change detection | ~150 lines | ~60 lines | same rule as ours; reuse "initial board = no one" idea |
| NVRAM | delegated to PINemHi | 0 | PinballY already runs PINemHi |

Legal: MIT needs the copyright notice kept in the copied parts (Fact, licence text). `scoringdb.json` is in the MIT repo.

## 3. PINemHi 3.x and PINemHi LeaderBoard

**Facts**
- Latest public version: **3.6.8** (pinemhi.com home, 2026-10-11; also `vps:resources/scoringdb.json` `"pinemhiVersion": "3.6.8"`). No release date on the site.
- The 3.6.8 package (as shipped in `vps:resources/pinemhi/`): `PINemHi.exe` (720 KB), `PINemHi_Leaderboard.exe`, `pinemhi_rom_monitor.exe` (AutoHotkey, "Microsoft Defender will frequently call AHK executables to be a virus/trojan"), `showboard.exe`, `romsub.exe`, `pinemhi.ini`, `pinemhi_replays.ini`, `romfind.ini`, `list.txt`, images and sounds. **No `7z\7z.exe` in that folder** (vpin-studio ships its own `resources/7z.exe`; whether the official zip contains one is still unverified).
- CLI: `PINemHi.exe <rom>.nv` (vpin-studio, PinballY), **`PINemHi.exe -lr`** = list supported ROMs (`PinemhiRamParser.java#L77`). 1,559 supported `.nv` names (`scoringdb.json supportedNvRams`).
- `pinemhi.ini` `[paths]` has `VP=`, `FP=` and (per the install notes) a user path "for games that use no rom"; `[options] replays/hiscores/buyins`; `[user] name/code` for the LeaderBoard.
- **LeaderBoard** "catches the score and specialscores from player 1" of the last game when you quit, and sends them to pinemhi.com; account = name + code from the site; challenges, weekly game, cups, badges, friends; a monitor process (`pinemhi_rom_monitor.exe`) works without any frontend plugin (install notes).
- **ROM-less tables** (46 tables on `code.php`: Aerosmith, Batman 66, Deadpool, Dune, Game of Thrones, Guardians, Pulp Fiction, Scarface, Stranger Things 4…): the user must **patch the table script** (needs PINemHi ≥ 3.6.7). Pulp Fiction snippet (`code_show.php`, fetched 2026-10-11): at load, `shell.run "romsub " & fakerom,0`; in `Table1_Exit`, write `UserDirectory & "pulpfiction.pmh"` = player-1 score × 6 with digits substituted by letters (`5→l, 3→L, 8→i, 6→I, 1→o, 4→O, 7→t, 2→j, 9→z, 0→s`), plus an `rsoff.pmh` file. This is for **LeaderBoard last-score submission**, not for reading the table's own board.

**Inference**
- PINemHi does not read EM text files nor `VPReg.ini`, and knows only the single `user\VPReg.stg` path (earlier research A5/B6).
- Replacing PinballY's bundled 1.3.1 by 3.6.8 is plausible (same `<rom>.nv` argument, same section titles; vpin-studio parses 3.6.8 output with the same parser that handles 1.3.1-style text), but still **unverified** for PinballY's own `pinemhi.ini` rewrite. No licence or redistribution terms were found on the site; PinballY bundles 1.3.1 "with the author's permission", so the pack must not ship it.
- The LeaderBoard's "player 1 score of the last game" is the closest existing "who played" feature, but it is tied to the pinemhi.com account, not to local profiles.

## 4. NVRAM maps and alternative parsers

**pinball-memory-maps** (ex pinmame-nvram-maps), Fact:
- 391 map files, 385 with `high_scores`; `index.json` maps **1,531 ROM ids**. Top platforms: WPC 12K (64) and 8K (52), Whitestar (40), Data East (36), Bally 35 (33), System 11 (30), Gottlieb System 3 (27), Stern SAM (21) (counted from `_metadata.platform`).
- "beta quality"; Scorbit sponsors the author since June 2025; since 2025 also maps volatile RAM (README#L1-L20).
- Licence: **ODbL 1.0 + DbCL** for maps since August 2026 (was LGPL-3.0); LGPL-3.0 for `tools/`. Attribution sentence requested: "This program makes use of content from the Pinball Memory Maps project." (README#L69-L84).
- Readers: `tomlogic/py-pinmame-nvmaps` (Python `nvram_parser.py`, LGPL-3.0, pushed 2026-10-06), `francisdb/pinmame-nvram` (Rust, MIT, pushed 2026-10-09), `jnv:` (Java, MIT). **No JavaScript reader found** (GitHub search for nvram+pinmame in JS/TS: 0 repos).

**Coverage comparison**, Fact from `jnv:allroms.csv` (2026-05-22, 2,827 PinMAME ROM ids):

| | all ROM ids | parent games (772) |
|---|---|---|
| PINemHi (3.6.x) | 1,524 | 430 |
| tomlogic maps | 867 | 303 |
| superhac | 244 | 189 |
| union | 1,739 | |
| maps or superhac but **not** PINemHi | 215 | |

**superhac/pinmame-score-parser**, Fact: Python, 1,712 lines, `resources/roms.json` with 247 ROM entries (decoders `leaderboard_bcd`, `mixed_leaderboard`, `single_*`), "Can also read certain .ini-based score files"; no CLI; **no licence** (README).

**pinball-scores (magnuspihl)**, Fact (README): verifies the map **checksums before trusting a decode**, because "A map for a near-miss ROM revision decodes to plausible garbage rather than failing — the `twd_156` map applied to `twd_156h` yields `Grand Champion: 0` and `CDC Champion: 4,294,967,295`." It reads only tables that have a bundled map, on purpose, because `VPReg.stg` "accumulates storages for tables the cabinet does not track".

**Inference: could the maps replace PINemHi text parsing?** Not for us. PINemHi covers more ROMs (1,524 vs 867), PinballY already runs it, and a JS map reader would need binary `.nv` reads (`dllImport`), BCD/nibble decoders, checksum checks, ~400 maps under a share-alike licence. Worth it only for the ~215 ROMs PINemHi lacks, and only if the cabinet's inventory shows some.

## 5. Other frontends and tools

- **PinUP Popper** (nailbuster wiki `high_scores_setup`, last modified 2019-04-03, Fact): not built in; a user `hiscore.bat` run from Popper's close script calls **PINemHi 1.3.1** and ImageMagick to make a PNG per table. Reads ROM tables, "PostIT" EM `.txt` files (Nov-2018 format only) and FP; FX2/FX3 and P-ROC listed as "Still to do". No player attribution. Popper users get structured scores through vpin-studio (it lists "PinUP Popper" as a frontend) and iScored.
- **PinballX** (Inference, from search results only): no built-in high score reader found; GameEx plugins exist for **PINemHi LeaderBoard** (PinballX ≥ 1.76) and a PINemHi challenge launcher. Forum pages returned 403.
- **LaunchBox / Big Box** "Visual Pinball X – Top Scores (hiscore) Viewer" by JoeViking245, v2.1.2 (2025-04-22): PINemHi for `.nv`, ROM-less feature contributed by Sbaby, shows PINemHi LeaderBoard personal top 10. No licence stated.
- **apaxson/vPinball-Highscore-Export** (GPL-3.0, 2026-08-28 → 2026-09-12): Python watcher on a folder of PINemHi exports + per-table VBScript patches (`ExportHighScoresCSV`); heuristic "3-character token + right-most number ≥ 1000 on a line"; pushes to a self-hosted "Leaderboard" app. Shows the same heuristic we considered for unknown formats.
- **Pinball FX / Zen**: not covered by any tool found (Popper wiki: "encoded files", still to do).

No tool found that attributes a new high score to "the person logged in on the cabinet". vpin-studio and pinball-scores both rely on initials.

## 6. VPReg.stg format (confirmed)

**Facts**
- VPX writes each value as the UTF-16LE text of the variant, no terminator, one sub-storage per table name, one stream per value (earlier research B2, VPX code).
- pinball-scores research notes: "an OLE Compound File: one storage per table, one stream per setting, each stream a UTF-16LE string. Scores are decimal strings and initials are plain strings — no checksum" (`pbs:research/stg-maps/README.md`). They also warn: "Slot number is not rank on the board either … Guardians holds its best score in slot 5 — so derive rank by sorting the values you read", and Game of Thrones uses `HighScore6`–`15` as one-slot champions.
- **Ran**: a 72-line Python CFB reader (header, DIFAT, FAT, mini-FAT, directory red-black tree walk) on vpin-studio's MIT sample files `testsystem/vPinball/VisualPinball/User/VPReg*.stg`:
  - `VPReg-iamondiscord.stg` 432 storages / 4,865 streams, `VPReg-gorgatron.stg` 152 / 1,999, `VPReg-local.stg` 60 / 724: **every stream is ASCII in UTF-16LE**.
  - `VPReg.stg` 22 / 271: 255 UTF-16LE streams, but **16 single-byte streams** (`3f3f` = "??" in `gotg`, `STLE`, `hpgof`; `30` = "0" and `3f3f3f` = "???" in `TimeLord`). Inference: written by some tool with a single-byte encoding (vpin-studio's current reset code writes UTF-16LE, `NumericListVPRegHighscoreAdapter.java#L55-L61`). A reader must accept both: UTF-16LE when the length is even and every odd byte is 0, else single-byte.
  - Example storage `WoZ`: `Credits`, `HighScore1..4`, `HighScore1Name..4Name`, `TotalGamesPlayed`.
- Ready-made CFB readers: Apache POI (Java, vpin-studio), OpenMcdf 3.2.0 (C#, pinball-scores), SheetJS `cfb` 1.2.2 on npm (Apache-2.0, last release 2022-04-06, 371 KB unpacked, 2 dependencies). Inference: a dedicated read-only parser in JS is ~150 lines (the Python one is 72), which fits the "no external library" rule better than vendoring `cfb`.

## 7. What this means for the pack (Inference)

1. **ROM tables**: keep PinballY's PINemHi board. Port vpin-studio's `RawScoreParser` rules (rank regex, separators, title whitelist, stop after the first block once 3 scores are found, dedup, renumber). Consider `PINemHi.exe -lr` (3.6.8 only; 1.3.1 support unknown) to know unsupported ROMs up front.
2. **Originals**: our own CFB reader + vpin-studio's key patterns (`HighScoreN`/`HighScoreNName`, `HSNameN`/`HSPointsN`, `HighscoreInits(N)`/`Highscore(N)`, `NameN`/`HighN`, single `hiscore`/`HighScore`/`HiScore`/`DBHiScore`, `hsaN`, `sScoreNP`) + the 15 hard-coded storages. Sort by value instead of trusting slot numbers. Add `VPReg.ini` ourselves (nobody supports it yet).
3. **EM text files**: vendor `scoringdb.json highscoreTextParsers` (MIT) keyed by file name; find the file by "modified during the Play" in the user folder instead of script scanning.
4. **GLF tables**: read `<name>_glf.ini` next to the `.vpx` (cheap).
5. **Change detection**: same rule as vpin-studio (an entry is new when no old entry has the same initials and score), filter score < 10 and empty initials, and treat the first board ever as belonging to no one (vpin-studio flags it `initialScore`).
6. **Attribution**: nothing to reuse; our "active Profile during the Play" model is new. Optionally show the initials typed as a hint.

## Open questions

1. Does PINemHi 1.3.1 accept `-lr`? (If not, a 3.6.8 drop-in gives it.)
2. Does the official 3.6.8 zip contain `7z\7z.exe`? (vpin-studio ships 7-Zip separately.)
3. Which ROMs on the cabinet fall in the 215 "maps but not PINemHi" set? Only that would justify a map reader.
4. Do any cabinet tables write `*_glf.ini` or `VPReg.ini`?
5. PINemHi licence or redistribution terms: none published; ask Dna Disturber (info@pinemhi.com) if the pack ever wants to automate the 3.6.8 install.
