# vpxtool (francisdb/vpxtool): can its high-score reader be reused?

Date: 2026-10-11. Builds on `docs/research/high-scores.md` (cited "HS §x"), which is not repeated here.

Sources (all read on 2026-10-11):
- **vpxtool** master `683b200` (2026-10-07, "chore: release v0.37.1"), cited `vt:<path>#Lnn`. Files read in full: `src/scores.rs`, `src/scores/vpreg.rs`, `src/scores/emhs.rs`, `src/scores/glf.rs` (header and parser), `src/cli.rs#L1745-L1780` and `#L2118-L2500` (the `scores show` command), `src/indexer.rs#L38-L61`, `#L771-L935`, `#L1424-L1431`, `#L1574-L1601`, `src/config.rs#L40-L125`, `#L169-L210`, `#L250-L290`, `Cargo.toml`, `Cargo.lock`, `CHANGELOG.md`, `README.md`, `tests/scores_fixtures.rs`.
- **pinmame-nvram** crate (`github.com/francisdb/pinmame-nvram`) master `d9f184c` (2026-10-09), cited `pn:<path>`. Its map submodule is **tomlogic/pinball-memory-maps** (the renamed pinmame-nvram-maps) at `68c1b33` (2026-10-02), the same commit HS §A6 read.
- GitHub API: releases, issues/PRs search, repo metadata. crates.io API for pinmame-nvram.
- **Runs**: the Linux x86_64 release binary v0.37.1, run in the sandbox on the repo's blank test table and on pinmame-nvram's test `.nv` files. The Windows zip was downloaded and its PE header inspected, not run.

**Fact** = read in code or observed in a run. **Inference** = my reading, not tested. **Verify** = needs the cabinet.

## Verdict

| Question | Answer |
|---|---|
| What does it read? | `vpxtool scores show <PATH>`: PinMAME `.nv` through the embedded pinball-memory-maps (1,531 ROM ids, 392 maps), and for ROM-less `.vpx` tables `VPReg.ini`, GLF `<cGameName>_glf.ini` and "Black's style" EM `.txt` files. **No `VPReg.stg` support anywhere** (Fact, grep of vpxtool and of the `vpin` crate). |
| Does it fit a Windows VPX 10.8.0 cabinet? | **Only for ROM tables.** It looks for `VPReg.ini` and EM `.txt` only in `<table folder>\user\` and `<table folder>\`, never in `<VPX folder>\User\` where released Windows VPX writes `VPReg.stg` and the text files (HS §B1). It targets the standalone / VPX 10.8.1+ "table folder" layout. |
| Reliability for ROM-less tables | **Heuristic and unsafe for an "after each game" diff.** The EM `.txt` probe takes *the first* `.txt` in `user\` (sorted by name) whose content looks like a score file, **without tying the file to the table**. Tested: a table with no score storage at all was given another table's scores. |
| As an external exe called by PinballY | Possible for ROM `.nv` files (fast: 13–29 ms per call on Linux, 18 MB console exe), as a **complement to PINemHi 1.3.1** for ROMs it does not know (e.g. `acd_170`, read fine). Not useful for EM or original tables on the current Windows layout. |
| As reference code to port to JS | **Yes, in small parts**: the `VPReg.ini` key families (`HighScoreN`/`HighScoreNName`, `HighScoreNameN`, legacy `hiscore`/`HighScore` + `hsa1..3`), the EM `.txt` "5 integers then 5 initials" block finder, the GLF key layout, and the regexes that find the `SaveValue` section name in a script. All are short, Apache-2.0, and have fixtures. |
| Recommendation | Do not depend on `vpxtool scores show` for the add-on. Port its parsers as reference into our own JS readers (HS options 3 and 4), with the table↔storage mapping done our way (diff-based or per-table config). Optionally offer vpxtool as a user-installed fallback for ROMs unknown to PINemHi 1.3.1. |

## 1. The command (Fact)

- Syntax: `vpxtool scores show [--format table|tsv|pinemhi] <PATH>`, with `PATH` a `.vpx`, a `.nv` or a ROM `.zip` (`vt:src/cli.rs#L1745-L1780`). `scores` has only the `show` subcommand.
- Added in v0.32.0 (2026-05-18), in PRs #779 to #793 (2026-05-15 to 2026-05-18), all by Francis De Brabandere (`vt:CHANGELOG.md#L273-L297`; `git log -- src/scores*`). No change to `src/scores*` since 2026-05-18. Issue #35 "Extracting high scores" (opened 2023-06-22) was closed 2026-09-10 with "Implemented as `vpxtool scores show`".
- Failure: message on stderr (`error: ...`) and **exit code 1**. For a ROM-less table with nothing found: "Could not find any high scores for <path>: tried PinMAME nvram, VPReg.ini, GLF, and EM-style .txt files" (run).

### Resolution order (`handle_scores_show`, `vt:src/cli.rs#L2248-L2420`)

1. **`.nv`** given directly: used as is. **`.zip`**: `<zip folder>\..\nvram\<stem>.nv`. **`.vpx`**: the script is read from the `.vpx` (or from a sidecar `<table>.vbs` if one exists, `vt:src/indexer.rs#L1424-L1440`), and the table counts as PinMAME only if a non-comment line contains `loadvpm` (`#L1594-L1601`). The ROM name is the first `cGameName` / `.GameName` string found (`#L1574-L1592`). The `.nv` is then looked up in (`#L885-L935`):
   - `<PinMAMEPath from VPinballX.ini>\nvram\<rom>.nv` (relative to the table if relative);
   - `<table folder>\pinmame\nvram\<rom>.nv`;
   - `<folder of vpx_executable>\VPinMAME\nvram\<rom>.nv` on Windows (`vt:src/config.rs#L66-L74`).
   The first and third need a vpxtool config file (`%APPDATA%\vpxtool\vpxtool.cfg`, `vpx_executable` set; `#L111-L125`, `#L250-L265`). It does **not** read the VPinMAME registry `nvram_directory` that PinballY uses (HS §A1), does **not** apply `alias.txt` to the `.nv` name (only to ROM zips, `#L937-L960`), and knows nothing of NVOffset.
2. `.nv` found but **no map** for it: error "No pinmame-nvram map for …", **no fallback**.
3. `.vpx` that is not PinMAME, **or a PinMAME table whose `.nv` was not found**: ROM-less probes (`try_non_pinmame_fallback`, `#L2306-L2386`), first hit wins:
   1. `VPReg.ini` in `<table folder>\user\` then `<table folder>\`, tried with every section name the script uses in `(Load|Save)Value(<arg>, "HighScore…"|"hiscore"|"hsaN")` (§2);
   2. `<table folder>\<cGameName>_glf.ini`;
   3. every `*.txt` in `<table folder>\user\` then `<table folder>\`, sorted by name, first file that parses (§3).
   A `VPReg.ini` that fails to parse **aborts the command** with an error instead of moving on (`#L2344-L2349`), so one malformed shared file breaks every table (Inference from code).

### Output formats (Fact, run on pinmame-nvram's `afm_113b.nv`)

- `--format tsv`: header `LABEL\tINITIALS\tSCORE\tUNITS`, one row per entry, **raw integers**, no section column. Buy-in and mode champions are flat rows, told apart only by their label:
  ```
  LABEL	INITIALS	SCORE	UNITS
  Grand Champion	SLL	7500000000
  First Place	BRE	7000000000
  …
  Buy-In Score #1	DWF	5000000000
  …
  Martian Champion	LFS	20
  Ruler of the Universe	TEX
  ```
- `--format pinemhi`: PINemHi-like blocks (header, blank line between sections), `1.` ranks, thousands separator always `,` on Windows (`Locale::en`, `vt:src/cli.rs#L2440-L2455`). **Buy-in entries are merged into "HIGH SCORES" as ranks 5–8** for AFM (run), because `split_high_scores` only lifts the first label out (`vt:src/scores.rs`, `split_high_scores`). Not a faithful PINemHi copy: no "REPLAY", "BUY-IN" sections.
- `--format table` (default): aligned columns, `,` grouping.
- No JSON for scores. `vpxtool nvram show <PATH>` prints the full resolved map as JSON (audits, settings, scores) for `.nv` files only (`#L2221-L2246`).
- Filtering (Fact, `vt:src/scores.rs`, `score_row_from_entry`): entries whose numeric value is 0 are dropped; `units: "seconds"` is formatted as `m:ss` in table/pinemhi views. Mode champion counts ("Martian Champion 20", "Combo Champion 20") come out as scores; the consumer must filter them (same "stat line" problem as HS §A3).

## 2. VPReg.ini reader (Fact, `vt:src/scores/vpreg.rs`)

- Section = the table name passed in; keys `HighScore<N>` + `HighScore<N>Name` or `HighScoreName<N>`, sorted by N as integers. Other keys (`Credits`, `TotalGamesPlayed`…) ignored.
- Fallback "legacy EM" shape: `hiscore` or `HighScore` (case-insensitive) + `hsa1..hsa3` as 1-based indexes into `"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_<"` (said to be found in "100+ extracted scripts").
- The section name itself is matched with `rust-ini`'s default lookup, which I believe is case-sensitive (Inference; VPX matches it case-insensitively, HS §B2).
- **Section-name discovery** (`vt:src/indexer.rs#L38-L61`, `#L798-L861`): strip `'` comments, collect `Const X = "…"` and `X = "…"` assignments, then for each `(Load|Save)Value(<id or "literal">, "HighScoreN[Name]"|"hiscore"|"hsaN")` resolve the first argument. All distinct names are tried in order. This covers `cGameName`, `TableName`, literals and `Dim` + assignment; it misses concatenated names, names built at runtime, and key families other than those three (`HSA1` works via `hsa\d+`, but `HSName`, `ScoreN`, `InitialN`… do not).
- Sample input (from its own doc and fixture `tests/fixtures/vpreg_modern_matrix.ini`):
  ```ini
  [TheMatrix]
  HighScore1=1154150
  HighScore1Name=SOM
  ```

## 3. EM `.txt` reader (Fact, `vt:src/scores/emhs.rs`)

- No file name logic at all: the comment says file names are not canonical, "so auto-detection is a glob + parse rather than a name lookup".
- Strategy 1: first window of **5 consecutive integer lines followed by 5 non-numeric lines of 1–12 characters**; zero scores dropped.
- Strategy 2: a file of **only integer lines (≥ 4 lines)**: the high score is **the maximum integer** in the file (no initials).
- **Misattribution, tested**: in a folder with the blank test table and two unrelated EM files (`Aladdin_other_table.txt`, `Zeta_other_table.txt`) in `user\`, `scores show` on the blank table printed the 5 scores of `Aladdin_other_table.txt` with exit 0. A `[SomeOtherTable]` `VPReg.ini` section did not change that. So in any folder shared by several tables (the usual `Tables\` folder, or a shared `user\`), every ROM-less table without a `VPReg.ini` hit gets **the alphabetically first EM file's board**. Strategy 2 also matches any all-number file (Inference: some settings files).
- Fixtures cover 8 Ball, Carnaval no Rio, Roller Coaster, long character names (Cuphead), 2 in 1, 4 Queens (`tests/fixtures/emhs_*.txt`).

## 4. GLF reader (Fact, `vt:src/scores/glf.rs`)

`[HighScores]` keys `<category>_<N>_label|name|value`, grouped by category, first distinct label lifted as its own section. File `<table folder>\<cGameName>_glf.ini` (vpx-glf framework, original tables). Not covered by HS; few tables (Inference).

## 5. NVRAM side (Fact)

- vpxtool v0.37.1 locks **pinmame-nvram 0.4.17** (2026-09-08, `vt:Cargo.lock`); 0.4.18 came out 2026-10-06 (crates.io). Both MIT.
- The crate embeds pinball-memory-maps compressed with brotli at build time (`pn:build.rs`), so **map updates need a new vpxtool release**. Map lookup is by `.nv` file stem in `index.json` (`pn:src/lib.rs#L305-L410`). At `68c1b33`: 1,531 ROM ids, 392 distinct maps; the project calls itself "beta" (README).
- ODbL notice: pinmame-nvram's README asks applications that publicly display decoded data to credit Pinball Memory Maps (ODbL).
- Run on `acd_170.nv` (a ROM PINemHi 1.3.1 does not know, HS §A2): 20 rows, Grand Champion + 4 places + 15 mode champions. So vpxtool can fill part of the PINemHi 1.3.1 gap. The exact overlap of the 1,531 map ids with PINemHi 1.3.1's 1,240 was **not computed**.

## 6. Packaging and maturity (Fact)

- Releases: v0.37.1 on 2026-10-07 (`vpxtool-windows-x86_64-v0.37.1.zip`, 6.6 MB, containing only `vpxtool.exe`, 18.3 MB). Also Windows aarch64, Linux, macOS. **49 release tags in 2026** (first tag v0.0.1 on 2023-05-16): very frequent, pre-1.0, with "breaking" entries in the changelog.
- `vpxtool.exe` is a **console** program (PE subsystem 3) and imports **`vcruntime140.dll`** (needs the VC++ 2015+ runtime; Inference: present on VPX cabinets). Launched from PinballY it needs `CREATE_NO_WINDOW` / a hidden window, and stdout capture via a pipe or a redirect to a temp file (HS §A5).
- Licence: `LICENSE` file and GitHub say **Apache-2.0**; `Cargo.toml` says `license = "MIT"` (inconsistent; Apache-2.0 is what the repo ships). Stars 55, 21 open issues; no open issue about scores (search "score": only #35 closed and #496 unrelated).
- Authors: scores code by one person (12 commits); the repo is 324 commits by the owner, 445 by dependabot.

## 7. Speed, inputs (Fact unless marked)

- Linux release binary: `scores show` on a `.nv` 0.029 s; on the blank `.vpx` (script read + all probes, failing) 0.013 s; `script show` and `romname` 0.004 s. 100 calls ≈ 1–3 s on Linux. **Verify** on Windows (process start + antivirus scanning of an 18 MB exe could be 50–200 ms each, Inference).
- For a `.vpx`, only the `GameData` stream is read (`vpx::open(path)?.read_gamedata()`), not images or sounds (Inference that this stays fast on 300 MB tables; tested only on a 0.5 MB table).
- Needs **a file path**, never a table name: the `.vpx` for ROM-less tables (script scan), or the `.nv` directly. From PinballY, `<resolveROM().nvramPath>\<vpmRom>.nv` can be passed directly, which skips vpxtool's own `.nv` search and config file (Inference).
- Not checked: protected/locked tables whose script may not be readable.

## 8. Known users (Fact)

- README "Projects using vpxtool" lists vpin-studio, vpx-editor, docker-vpxtool-resize, aztec-quest, vpx-gui-tools and others. **vpin-studio only calls `extractvbs` and `importvbs`** (`syd711/vpin-studio:vpin-studio-server/src/main/java/de/mephisto/vpin/server/vpx/VPXUtil.java#L183-L240`); it has its own score parsers (HS §B3).
- GitHub code search for `"vpxtool scores"` / `"scores show" vpxtool`: hits only in vpxtool itself. **No known frontend integrates `scores show`** (as of 2026-10-11).

## 9. What it means for the pack

**Inference**
- **ROM tables**: PinballY + PINemHi 1.3.1 stay the primary source. vpxtool could be a user-installed fallback when PINemHi says "Not supported rom": run `vpxtool scores show --format tsv "<nv path>"` hidden, parse the TSV (simpler than PINemHi text: tab-split, raw integers), then `setHighScores()`. Caveats: sections are lost in TSV (buy-in and mode champions only recognisable by label), map gaps differ from PINemHi's, cannot be bundled without user approval (external dependency), and the ODbL notice.
- **EM and original tables on Windows VPX 10.8.0**: vpxtool reads none of the real storages (`<VPX>\User\VPReg.stg`, `<VPX>\User\*.txt`). Once the cabinet moves to VPX 10.8.1+ in the "AppPrefData" layout (`<table folder>\user\VPReg.ini`, HS §B1), its `VPReg.ini` reader would apply, but the EM `.txt` glob would still misattribute in shared folders.
- **Worth porting** (Apache-2.0, small, with fixtures): the `VPReg.ini` key families incl. `HighScoreNameN` and `hsaN` decoding, the 5+5 EM block finder, the GLF layout. Combine them with HS's diff approach (the storage or file that changed during the Play belongs to the table) instead of vpxtool's "first match" rule.
- **Mapping without the script**: if a table↔storage map is wanted up front, `vpxtool script show <table.vpx>` (stdout, 4 ms on a small table) could be run once by the user or a maintainer script to extract `cGameName` / `HSFileName` / `SaveValue` section names, using vpxtool's own regexes. That is offline tooling, not a runtime dependency.

## Open questions (Verify)

1. Which VPX build and layout the cabinet runs (decides whether `VPReg.ini` in table folders exists at all). Same as HS open question 3.
2. vpxtool.exe start-up time on the cabinet for 100 calls, with antivirus.
3. Overlap of pinball-memory-maps (1,531 ids) with PINemHi 1.3.1 (1,240) and PINemHi 3.6.8 (1,560) on the cabinet's actual ROMs.
4. Whether the user accepts an external, frequently-updated, 18 MB dependency at all (project rule: no external library without approval).
