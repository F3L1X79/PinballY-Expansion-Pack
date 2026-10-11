# Research: size, scope and existing tools for "Records par Profile"

Date: 2026-10-11. Companion to [`high-scores.md`](high-scores.md) (2026-10-10, cited "HS §x"), which explains how each kind of table stores its board. This file does not repeat it.

Questions, for roadmap item #2 of `docs/roadmap.html` ("Records par Profile : qui a fait les high scores", currently **gold / moyen-gros**):
1. Should it be ranked platinum ("gros"), or is it so big that it should be a separate project?
2. Do existing tools already do this (vpxtool `scores show`, vpin-studio's VPReg reader, reading `VPReg.stg` through 7-Zip), and can we reuse them?
3. Does PinballY issue mjrgh/PinballY#277 (PINemHi for ROM-less tables) mean that PinballY already covers this, or do we have to go much further?
4. What is the recommended way forward in the Matt flow (`/grill-with-docs` now, then `/prototype` → `/to-spec` → `/to-tickets` → `/implement`)?

Sources: three notes files written on 2026-10-11, which give the details and citations:
- [`high-scores-tools/vpxtool.md`](high-scores-tools/vpxtool.md): vpxtool v0.37.1 source and runs, and the pinmame-nvram crate.
- [`high-scores-tools/vpin_studio_and_community_tools.md`](high-scores-tools/vpin_studio_and_community_tools.md): vpin-studio 5.4.3 source, PINemHi 3.6.8 and LeaderBoard, pinball-memory-maps, other frontends, `VPReg.stg` format checked on sample files.
- [`high-scores-tools/pinbally_builtins_and_integration.md`](high-scores-tools/pinbally_builtins_and_integration.md): issue #277 and related PinballY issues, the JS high score API, running programs and reading binary files from JS, VPX 10.8.x `VPReg` status.

Also used: the grill decisions in `docs/roadmap.html` (item `#profile-records`) and `.claude/rules/conventions.md`.

**Fact** = read in a primary source or observed in a run, as cited in the notes. **Inference** = my reading.

## Verdicts

| # | Question | Verdict |
|---|---|---|
| 1 | Rank | **All three kinds of table in one item is platinum.** ROM tables alone, with the product layer the grill already decided, stay **gold**. Recommendation: keep #2 gold and limited to ROM tables, and move the EM and original-table readers to a **new roadmap item (gold)**. It does not have to be a separate project: it is the same Add-on with more sources behind one seam. |
| 2 | Existing tools | **No tool does the core feature**: crediting a new score to the person who played. Every tool found matches by initials, or by a pinemhi.com account. **Nothing can be reused as a runtime dependency**: vpxtool misses the real Windows storage, vpin-studio is a Java server, and 7-Zip is an external exe. **Their rules and data are worth porting** (MIT / Apache-2.0). |
| 3 | PinballY #277 | **No.** The issue is open and not worked on. Even if it were fixed, PinballY only runs PINemHi when a `.nv` file exists, and PINemHi's "ROM-less support" only sends player 1's last score to its online LeaderBoard, after a per-table script patch. For ROM tables PinballY already gives the board. For ROM-less tables we would have to go much further, on our own. |
| 4 | Way forward | Finish the grill with one more decision (the scope split and what it costs), widen the planned prototype so that it also counts ROM-less tables, then `/to-spec` for ROM tables only (about 6 tickets). After the prototype, schedule the ROM-less item or drop it, based on how many cabinet tables it would add. |

## 1. Size: gold, platinum, or a separate project?

The work splits into three blocks (estimates are Inference, from the notes' JS line counts and the grill decisions):

| Block | Content | Size alone |
|---|---|---|
| **A. Product layer** (any source) | Play bracket (board before / after, stale cache, killed VPX), multiset diff, "first board belongs to no one", per-Profile storage of earned High Scores and Table Records (new persisted keys), 7 Achievements, toast, Profile Stats and Household Stats lines, Add-on toggle, en/fr texts | **Silver to gold.** Most of the item's real work |
| **B. ROM source** | Read PinballY's board (`highscoresready` / `getHighScores()`), PINemHi text parser (port of vpin-studio's `RawScoreParser` rules, about 80 lines), detect "Not supported rom" text | **Bronze to silver.** No native code, fully testable with `node --test` |
| **C. ROM-less sources** | `VPReg.stg` reader (`dllImport` of `CreateFileW`/`ReadFile`/`CloseHandle` plus a JS compound-file parser of about 150 lines), `VPReg.ini` reader, key families (`HighScoreN`/`HighScoreNName`, `HSA1..3`, about 15 vpin-studio patterns), find a game's storage by what changed during the Play, EM text-file reader (files changed during the Play plus a "5 scores + 5 initials" block finder or vpin-studio's 44 configs), GLF `*_glf.ini`, optional `setHighScores()` so the DMD shows these boards | **Gold on its own.** New risks: a wrong `dllImport` definition crashes PinballY; holding `VPReg.stg` while VPX starts can reset a table's board (HS §B5); file layouts are per author; VPX 10.8.1 moves writes to `VPReg.ini` |

- A + B is what the "moyen-gros" tag priced, so **gold is right for that scope**.
- A + B + C is two gold-sized pieces, one of them risky: **platinum**, roughly 10 to 12 tickets.
- C is not a separate project: it plugs into A behind a "board source" seam (a function that returns a normalised board for a game, before and after). Making it a **separate roadmap item**, placed after #2, keeps #2 deliverable and lets the prototype decide whether C is worth doing.

**The cost of the split (decision for the grill).** The grill decided that scores already on a board at its first reading belong to no one, forever, and the roadmap note says to start early because "l'auteur d'un record ne se retrouve pas après coup". So every High Score set on an EM or original table before C ships stays anonymous. That cost grows with the number of ROM-less tables played. The prototype measures it.

## 2. Existing tools: what they do and what we can reuse

| Tool | What it reads | Who set the score | Use as a runtime dependency | Worth porting |
|---|---|---|---|---|
| **vpxtool** `scores show` (v0.37.1, Apache-2.0) | `.nv` through pinball-memory-maps (1,531 ROM ids); `VPReg.ini`, GLF, EM `.txt` only in `<table folder>\user\` or `<table folder>\` | nobody | **No.** It does not read `VPReg.stg`, so it misses every released Windows VPX (10.8.0). It never looks in `<VPX>\User\`. Its EM probe takes the alphabetically first `.txt` that parses, without tying it to the table: **tested, a table with no scores got another table's board**. It is an 18 MB console exe released very often (49 tags in 2026). Possible only as a user-installed fallback for ROMs unknown to PINemHi 1.3.1 (it read `acd_170`). | The `VPReg.ini` key families incl. `hsaN` decoding, the EM 5+5 block finder, the GLF layout, with their fixtures |
| **vpin-studio** (5.4.3, MIT) | Everything except `VPReg.ini`: `.nv` (PINemHi 3.6.8, then maps), `VPReg.stg` (Apache POI, 15 adapters), 44 EM text configs, GLF | **by initials only**; `???` goes to an admin player | **No.** Java plus a Spring server. Its PinballY support is `RunBefore`/`RunAfter` curl calls to its own REST server, so a user would have to run vpin-studio itself | **Most valuable.** `RawScoreParser` rules (rank regex, separators, 22-title whitelist, stop at the first blank line after 3 scores, dedup, renumber); VPReg key patterns; `scoringdb.json` text configs; the diff rule (new when no old entry has the same initials and score; ignore score < 10); the "first read = initial board" flag. Keep the MIT notice |
| **7-Zip on `VPReg.stg`** (what PINemHi 3.6.8 does: `7z e … "<name>/*"`) | extracts one storage's streams to files | n/a | **No.** It needs an external exe the user must install, process launch plus temp-file polling, and the storage name in advance. It only replaces the file-format part, which is the easy part | Nothing. A JS compound-file reader is about 150 lines (a 72-line Python version read all 4 sample files), runs under `node --test`, and holds the file for milliseconds |
| **PINemHi 3.6.8** | 1,559 ROMs; "almost all top 5" from `VPReg.stg` through 7-Zip, by storage name | LeaderBoard: player 1 of the last game, pinemhi.com account | Only as a **user drop-in** in `<PinballY>\PINemHi\` (+317 ROMs, not verified with PinballY's ini rewrite). Cannot be shipped: no licence terms, and PinballY bundles 1.3.1 "with permission" | — |
| pinball-memory-maps, superhac, pinball-scores, Popper, PinballX, LaunchBox | ROM `.nv` (some `VPReg.stg`) | none, or initials | No: no JS reader exists; share-alike or no licence | pinball-scores' warnings: a near-miss map decodes plausible garbage; slot number ≠ rank, so sort by value |

**Licence and approval** (Inference): porting rules and regexes into our own code is not an external library. Copying `scoringdb.json` (data, MIT) or test fixtures is vendoring and should be approved by the user like a dependency, with the notice kept. Calling vpxtool, 7-Zip or PINemHi 3.6.8 from the Add-on needs explicit approval (`conventions.md` § Dépendances).

**What nobody has**: crediting a score to "who was in front of the cabinet". Our rule (the active Profile at the start of the Play, whatever the initials) is new. That part is ours to build, whatever the source.

## 3. Does PinballY #277 mean PinballY already covers this?

**Facts** (notes, PinballY file §1.2–1.3):
- #277 (2026-02-25) asks for a newer PINemHi so that ROM-less boards show. It is **still open**, no commit since 2026-02-24, last release 1.1.0 Beta 10 (2024-11). PinballY still bundles **PINemHi 1.3.1 (2015)**.
- A user who dropped in the new PINemHi reported that it "doesn't do the trick". mjrgh's workaround (put a fake ROM name in the ROM field) cannot work: PinballY skips PINemHi when `<rom>.nv` is missing (HS §A1).
- PINemHi's "ROM-less support" (46 tables, version 3.6.7 or later) means pasting two snippets into **each table's script**, which then write an encoded copy of **player 1's last score** for the online LeaderBoard. It is not a top-N board, and it is not local.

**Inference — what this means**:
- **ROM tables: PinballY already covers the reading.** The Add-on adds parsing, the before/after diff and attribution. Going further (a newer PINemHi, vpxtool for missing ROMs) is optional and is a user step.
- **ROM-less tables: PinballY covers nothing**, and fixing #277 would not change that. PINemHi 3.6.8's `VPReg.stg` path also needs the storage name and 7-Zip, and knows neither `VPReg.ini` nor EM text files. Covering these tables means building block C ourselves. That is the "much further" part, and the reason to split it out.
- Side benefit of C: through `setHighScores()`, EM and original tables would show their board on the DMD and in the info box, which is what #277 asks for. That could become a separate ticket, or later a contribution upstream.

## 4. Recommended way forward

### Grill (`/grill-with-docs`, in progress)
Settle, as grill questions:
1. **Scope split**: #2 = ROM tables (blocks A + B), with a board-source seam. Recommended: yes.
2. **What to do with ROM-less tables**: a new roadmap item "Records des tables sans ROM (VPReg, fichiers EM)", gold, placed right after #2; drop it if the prototype counts few such tables. Accept that their scores stay anonymous until then.
3. **Port rather than call tools**: port vpin-studio's parser rules (MIT notice); no runtime call to vpxtool, 7-Zip or PINemHi 3.6.8. Optional and documented for users: drop PINemHi 3.6.8 into PinballY's folder (verify first).
4. The 4 open questions already listed in the roadmap; the notes answer part of them (diff rule, ignore score < 10, first read, "Not supported rom" text).

### Prototype (`/prototype`, on the cabinet)
The logger planned in HS ("Prototype on the cabinet") plus what the decision needs:
- Per table: its kind (ROM / EM / original), whether PinballY returns a real board, and the "Not supported rom" text. **This gives the share of tables #2 covers.**
- VPX build and layout: `<VPX>\User\VPReg.stg` and/or `<table folder>\user\`, `VPReg.ini`, EM `.txt` files with their dates, `*_glf.ini`. **This gives the share and the cost of C.**
- Optional: list the storage names in `VPReg.stg` (a quick spike with the CFB parser) to see how many original tables keep scores there.

Decision rule: if ROM tables make up most of what is played, ship #2 and schedule C later. If ROM-less tables are a large share of what is played, put C straight after #2 (or consider merging, and then rank it platinum).

### Spec and tickets (ROM tables only)
`/to-spec` then `/to-tickets`, about 6 tickets (Inference):
1. PINemHi board parser and "Not supported" detection (pure module, `node --test`, sample boards as fixtures).
2. Play bracket: board before and after, stale cache (`setHighScores(null)` after `gameover`), first board belongs to no one, killed VPX.
3. Per-Profile storage of High Scores and Table Records, deleted Profile → anonymous (new keys, add them to `persisted_data_pinning.test.js`).
4. Achievements (7, names chosen at the spec).
5. High Score toast.
6. Profile Stats and Household Stats lines, `addons/high_scores.js` toggle, en/fr texts.

The "Mes records" filter (bronze) and the rivalries (silver) stay separate items, as now.

### Later item (if kept): ROM-less sources, gold, about 4–6 tickets
`VPReg.stg` reader (`dllImport` file read + JS CFB parser, reads both UTF-16LE and single-byte streams); `VPReg.ini` reader (`.ini` first, `.stg` per missing value, like VPX); storage↔game discovery by diff; EM text reader; GLF ini; DMD display through `setHighScores()`. Split EM text off as a silver item if the prototype shows few EM tables.

## Open questions (for the prototype)
1. How many of the cabinet's ~100 tables (and of the plays in the Play Log) are ROM / EM / original, and how many ROM tables get a real board from PINemHi 1.3.1?
2. VPX build and file layout on the cabinet (`.stg` only, or `.ini` already)?
3. Does PINemHi 3.6.8 work as a drop-in inside PinballY (ini rewrite, output format)? Does PINemHi 1.3.1 accept `-lr`?
4. Will the user approve vendoring vpin-studio data (`scoringdb.json`, fixtures) under its MIT notice?
