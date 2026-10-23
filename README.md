# PinballY Expansion Pack

An unofficial extension of [PinballY](http://mjrnet.org/pinscape/PinballY.php), written with the JavaScript scripting API that PinballY opens to every developer. · *[Version française](README.fr.md)*

> **Give everyone in the house a real reason to come back to your pincab.** A Profile with an Avatar for each of you, a Welcome Screen with the Table of the Day, weekly Challenges, a Mastery Level on every table, Achievements from Bronze to Platinum (a few of them secret) that raise your Player Level, your own stats, and PinballY itself in French, German, Spanish, Italian or Portuguese: everything PinballY was missing, without touching PinballY. [More is on the way…](#coming-next)

<img src="docs/images/hero.png" alt="The wheel screen with the clock, the active Profile's badge and its Player Level, the week's Challenge Card, the Mastery Bar and the Wheel Arc" width="360">

### A Profile for everyone

<img src="docs/images/profiles.png" alt="The Change Player carousel and its Avatars with their Player Level" width="400">

With Change Player, each of you picks your own Profile and Avatar, and the Welcome Screen greets you by name so you know whose games will count. Only games of at least a minute count, so a launch by mistake never spoils anything. Your Daily Streak counts the days in a row you have played, on any table. Guest is always there for visitors. On a shared cabinet, PinballY can start on Change Player so that everyone picks their Profile before playing, or straight on the wheel (`STARTUP_SCREEN`, below).

### Profile Stats

<img src="docs/images/profile_stats.png" alt="The Profile Stats of a Profile: Player Level, Collection Mastery, games, Streaks, tastes and first, most and last played tables" width="480">

**My Profile**, in the main menu, sums up your pinball life: games played and total time, your Player Level and Collection Mastery, average game length, favourite manufacturer, decade and table, the first table you ever played, how much of the collection you have tried, your Achievements, your Daily Streak and your Table of the Day and Table of the Week Streaks, the Challenges you completed, the Avatar Frame you wear, and the way to your most played tables and to the ones still to discover. Once two of you have a Profile, **Household Stats** sets every Profile but Guest side by side, Avatars in their frames, the best of each line in gold; pick a column to see that Profile's own stats.

<img src="docs/images/household_stats.png" alt="The Household Stats with three Profiles side by side, the best of each line in gold" width="400">

### Welcome Screen: Table of the Day, Table of the Week

<img src="docs/images/welcome_screen.png" alt="The Welcome Screen with the Table of the Day and the Table of the Week" width="480">

Every day there is a table nobody in the house has played yet, or the one left alone the longest, and every week a random one. The Welcome Screen greets you with both at startup, again after Change Player, and whenever you pick **Welcome Screen** in the main menu, with what they mean for you: launch one of them, stay on the table on the wheel, change player or spin a Random Game. Play them several days or weeks in a row to build a Streak. While the Welcome Screen or Change Player is open, the video sound of the table on the wheel is turned down, and comes back as they close.

### Weekly Challenges

<img src="docs/images/challenges.png" alt="The week's Challenge Card with its progress and the days left" width="368">

A new Challenge comes every Monday, the same for the whole household: five different Stern tables, three tables you have never played, half an hour on a single table... Its card on the wheel screen tracks your progress. **Challenge Tables**, right under "All Tables" behind "Change Filter" in the main menu, keeps only the tables that would move it forward, and leaves the list once there are none. Completing it brings a shower of confetti across the wheel screen.

### Table Mastery

<img src="docs/images/table_mastery.png" alt="The Mastery Bar of the selected table: Rookie, Mastery Level 1" width="297">

Every minute you play a table builds your Table Mastery of it, through ten Mastery Levels from Rookie to Pinball Wizard, each longer to reach than the one before. The Mastery Bar, at the top right of the wheel screen, shows how far you are on the selected table, and a toast announces the level you reach. When ten of your tables reach the next level, your Collection Mastery climbs a tier. Mastery Level 10 on a table and each new Collection Tier bring a shower of confetti. Each Collection Tier also unlocks an Avatar Frame, from the Enchanted Forest to the Celestial Legend, to wear around your Avatar: pick it in **My Profile**, under **Frame**. Play on a holiday (New Year's Day, Chinese New Year, Valentine's Day, Easter, Halloween, Christmas and five more) and that day's Holiday Frame is yours for good, announced by a toast when you come back to the wheel.

### High Scores

When you enter a table's high score board, the place is yours: the pack reads the board before and after each game and, for a game of a minute or more, credits every new score to the Profile that was playing, whatever initials were typed, the other players of a multiplayer game included. A toast announces your best place, or the Table Record and whom you took it from. When someone else takes one of yours, Guest included, your next Welcome Screen tells you who, once, so you know which record to win back. The scores already on the board at the first read, factory ones included, belong to no one, and a ROM reset that brings them back is never credited. A High Score stays won even once later scores push it off the board, and earns its own Achievements; **My Profile** shows the High Scores and Table Records you still hold, and **Household Stats** who holds the most Table Records. Tables without a ROM (community originals) count too: the pack reads their board in Visual Pinball X's `User` folder (`VPReg.stg`, or the text file some tables keep there), learns where each table keeps it during its first game, and hands it to PinballY, so the DMD and the table's info box show it as well. Their board appears once such a table has been played with the pack.

<img src="docs/images/high_score_board.png" alt="A table's High Score Board: the podium under its three crowns, then the other places, one of them won by a Profile" width="400">

**High Scores** in the main menu (or PinballY's `HighScores` button, if mapped) opens the selected table's board, drawn in the Steamball look in place of PinballY's own window: the three first places on a podium under a Gold, Silver and Bronze crown, the others in rows below, each with its rank, score, initials and the Profile that won it (name, Avatar and Avatar Frame), or "Default score" with a portrait picked by its initials, the same on every table. The board is read again from the table each time you open it, so it always shows what the table holds now; the flippers scroll a board too long for the screen.

### Achievements

<img src="docs/images/achievements.png" alt="The Achievement List" width="380">

There are dozens of Achievements, from Bronze to Platinum: manufacturers and decades completed, hours played, Streaks, Challenges, a full tour of the wheel... Each one is announced by a small toast in a corner, without interrupting your games; a Platinum also brings a shower of confetti across the wheel screen. The Achievement List, opened from **My Achievements** in the main menu, shows how far you are from each missing one, and which of the household's Avatars already have it. A few stay secret, shown as "???" with a hint, until you stumble upon them. A Child Profile has three more of its own: Snack Time, Wednesday Off and Beat the Grown-Ups, a Table Record taken from a grown-up.

<img src="docs/images/toasts.png" alt="An Achievement Toast" width="440">

Each Achievement earns points toward your **Player Level**, the more the higher its Rank, with no last level. It shows as a small pip on your Avatar, in bronze, then silver, gold and platinum as you climb, and reaching a new level brings its own toast and fireworks.

### PinballY in 6 languages

<img src="docs/images/main_menu.png" alt="The drawn main menu in French, sorted into sections" width="400">

PinballY's own menus and messages in French, German, Spanish, Italian or Portuguese.

### For the cabinet owner

- **Admin Profile**: the setup entries for you alone.
- **Child Profile**: a wheel without Adult Tables for the kids.
- **Profile Reset**: start a Profile over, or the whole household at once.
- **Menu Cleanup**: leaner PinballY menus.
- **Expansion Pack Settings**: from the Operator Menu, turn each Add-on on or off by category, pick the startup screen and the language, then restart PinballY in one press.

Everything stays in one folder, with no change to PinballY itself.

**And also**:
- PinballY's menus (main menu, Exit, filters, power off, table setup, Operator Menu, a game's pause, media capture, batch capture included, and confirmations) and other scripts' menus, drawn in the pack's Steamball look, same entries, sorted into sections, and same buttons; in the pause, Exit and "Cancel" resume the game; a shorter main menu gathers every wheel selection and filter group behind one "Change Filter" entry, and names the filter the wheel shows under its list ("Active filter: All Tables");
- a Random Game spun on a wheel of fortune;
- "Tables to Discover", "Most Played Tables", "My High Scores" (the tables where you hold a place on the board), "Favorite Tables", "Hidden Tables" (while a table is hidden) and "Original Tables" behind "Change Filter";
- a clock, a gold arc under the wheel (the Wheel Arc) and a richer status line;
- a reminder to rate a table;
- launches without a black flash, with a gold comet turning while you wait, the step under way written in gold beneath it while a table launches or closes ("Loading…", "Returning to tables…"): during a launch, at startup, while a high score board is read and while the Profile Stats, the Household Stats, the Achievement List or the Avatar Frame list get ready;
- the backglass hidden during a game;
- sounds for launches, Achievements, greetings, confetti and fireworks, or your own.

## Coming next

Here is what we are thinking about for the pack's future. Nothing is promised: plans change, and some of these ideas may never ship.

- **Year in Pinball**: each Profile's year in review, the tables played and discovered, the hours, the favourites, the Achievements and the longest Streak.
- **Themes**: other looks than Steamball for every drawn screen, with a small editor to make your own.
- **Ratings and favourites for each Profile**, then the household's average rating of each table.
- **Install in 30 seconds and updates**, without git.
- **The latest texts translated** into German, Spanish, Italian and Portuguese.

## Install

Requires **Windows** and **PinballY 1.1.0 Beta 10** or later (plus the *Windows Media Player* optional feature, for the sounds).

1. **Copy the project into `PinballY\Scripts\ExpansionPack`**, under that exact name: the pack looks for its files there. From a downloaded zip, rename the extracted folder (`PinballY-Expansion-Pack-main`) to `ExpansionPack`; with git, run `git clone https://github.com/F3L1X79/PinballY-Expansion-Pack.git ExpansionPack` from `PinballY\Scripts`.
2. **Add this line to `PinballY\Scripts\main.js`**, or create the file with only this line if you have none:
   ```js
   import "./ExpansionPack/main.js";
   ```
   Your own scripts keep running: nothing else in `Scripts` is touched.
3. **Copy `ExpansionPack\.env.example` to `ExpansionPack\.env.local`** and set what you need, one `KEY=value` per line (UTF-8). Missing settings keep their default; `.env.local` is ignored by git.
4. **Optional: install vpxtool**, so each table's ROM is filled in by itself (Table ROMs). Download `vpxtool` for Windows from its releases page (https://github.com/francisdb/vpxtool/releases) and put `vpxtool.exe` in `ExpansionPack\tools` (next to the restart helper already there). Without it, a table's ROM is still found, after its first Play.
5. **Optional: update PINemHi to 3.6.8**, so the High Scores read the boards of about 300 more ROMs. Replace the files of `PinballY\PINemHi` with those of PINemHi 3.6.8, then **append the whole `[romfind]` section of its `romfind.ini` to the end of its `pinemhi.ini`** (PinballY reads that section from `pinemhi.ini` only: without it, a table with an empty ROM field gets no board at all), and set `USER=` in `pinemhi.ini` to Visual Pinball X's `User` folder.
6. **Restart PinballY** and check `PinballY.log`: it lists your overrides, one "initialized" line per add-on, and `ERROR` lines naming the add-on at fault.

Everything the pack keeps stays in `Scripts\ExpansionPack`: your settings (`.env.local`) and each Profile's progress (`profiles`). **To back up**, copy that folder. **To uninstall**, delete it and remove the import line from `Scripts\main.js`.

## Settings

Settings live in `Scripts\ExpansionPack\.env.local`, one `KEY=value` per line. The Add-ons, the startup screen and the language can also be set without editing it, from **Expansion Pack Settings** in the Operator Menu. Only write the ones you change, for example:

```
LANGUAGE=en
ACHIEVEMENT_SOUND_FILE=assets\sounds\local\trophy.mp3
ADD_ON_CLOCK=false
```

| Setting | Default | What it does |
|---|---|---|
| `LANGUAGE` | `en` | Interface language: `en`, `fr`, `de`, `es`, `it` or `pt`. |
| `ADULT_CATEGORY` | `NSFW` | PinballY category of the Adult Tables, hidden from Child Profiles. |
| `COMMUNITY_TABLES_MANUFACTURER` | `VPX Community` | Manufacturer you gave to fictional or community tables, for the status line and the "Original Tables" filter. |
| `LAUNCH_SOUND_FILE` | `assets\sounds\launch.mp3` | Sound played when a table launches: a path from the pack's folder (your own sounds go in `assets\sounds\local\`) or a full path; empty = no sound. |
| `ACHIEVEMENT_SOUND_FILE` | `assets\sounds\achievement.wav` | Sound played with each Achievement toast. |
| `PROFILE_GREETING_SOUND_FILE` | `assets\sounds\profile_greeting.mp3` | Sound played when a player is greeted. |
| `CONFETTI_SOUND_FILE` | `assets\sounds\confetti.wav` | Sound played once when a shower of confetti starts. |
| `FIREWORKS_SOUND_FILE` | `assets\sounds\fireworks.wav` | Sound played once when the Fireworks start. |
| `PROFILE_PICKER_SOUND_FILE` | empty | Sound played once when PinballY starts on the Profile picker (`STARTUP_SCREEN=profilePicker`); none ships with the pack. |
| `STARTUP_SCREEN` | `welcome` | What PinballY shows first: `welcome` (the Welcome Screen), `profilePicker` (the "Change Player" carousel, then the Welcome Screen; skipped while Guest is the only Profile) or `wheel` (the bare wheel, the last player greeted). A screen whose feature is turned off gives way to the next one, from the carousel to the Welcome Screen to the wheel. |
| `ACHIEVEMENT_TOAST_SECONDS` | `4` | Seconds an Achievement toast stays on screen (up to 60). |
| `ACHIEVEMENT_TOAST_SCALE` | `1.0` | Size of the toast, from `0.5` to `3`. Raise it on a large screen. |
| `CONFETTI` | `true` | `false` turns off the Confetti Shower that falls with the toast of a completed Challenge, a Platinum Achievement, Mastery Level 10 on a table or a new Collection Tier, if your PC struggles with it. |
| `FIREWORKS` | `true` | `false` turns off the Fireworks that come with the toast of a new Player Level, if your PC struggles with them. Independent of `CONFETTI`. |
| `SKIP_RANDOM_GAME_ANIMATION` | `false` | `true` skips the wheel of fortune and launches the Random Game at once. |
| `ASK_TO_RATE_AFTER_MINUTES_PLAYED` | `60` | Minutes played on a table before you are asked to rate it. |
| `LOG_UNTRANSLATED_MENU_TITLES` | `false` | `true` writes each untranslated PinballY menu title to `PinballY.log`. |
| `LOG_LAUNCH_EVENTS` | `false` | `true` writes each launch event to `PinballY.log` with a millisecond timestamp, to check their order on the cabinet. |

Every feature can also be turned off with its `ADD_ON_*` key, for example `ADD_ON_CLOCK=false` or `ADD_ON_CHALLENGES=false`. Only Menu Cleanup is off by default. Each key is described in [.env.example](.env.example).

Each Profile's progress is saved in `Scripts\ExpansionPack\profiles`. Keep that folder when you reinstall or update the pack, and you get your progress back.

### Admin Profile

To keep the setup entries for yourself, add `"isAdmin": true` at the top level of your Profile's `Scripts\ExpansionPack\profiles\<name>\profile.json`, PinballY closed. Once at least one Profile is marked, the other Profiles (Guest included) no longer see "Set Up Table" in the main menu nor "Operator Menu" in the Exit menu; the Admin Profiles still see both, and the coin door service button still opens the Operator Menu for anyone. Several Profiles can be marked. Guest is never an Admin Profile, and a mark that is not `true` or `false`, or whose key is misspelt (`"isAdmin "`, `"IsAdmin"`), is ignored and logged in `PinballY.log`.

An Admin Profile also finds **Reset profile** in the Exit menu (Escape), right after "Operator Menu". It lists every Profile, Guest and yourself included, plus "Every profile", once there are two or more, to reset the whole household at once. After one confirmation (the cursor starts on "No"), the chosen Profile starts over: its plays, Streaks, session records, Random Games, Challenge progress, announced Achievements, Table Mastery, Collection Tier and Avatar Frames are erased, while its name, Avatar, marks and the High Scores it won stay. A message then tells whether it worked. Its former files are kept next to them, as `profile.reset-<date>.json` and `play-log-<year>.reset-<date>.json`: to undo a reset, close PinballY and rename each copy back, without its `.reset-<date>` part. Reset profile needs PinballY's Exit menu: if you disabled it in PinballY's options, the entry cannot show.

### Child Profile

To keep the Adult Tables away from a child, tag them in PinballY with the category `NSFW` (or name your own category with `ADULT_CATEGORY` in `Scripts\ExpansionPack\.env.local`, spelt exactly as in PinballY), then add `"isChild": true` at the top level of the child's `Scripts\ExpansionPack\profiles\<name>\profile.json`, PinballY closed. While that Profile is active, those tables are left off the wheel whatever the filter, the Random Game never draws one, and starting up never leaves the wheel on one; switching to another Profile brings them back at once. The Table of the Day and the Table of the Week stay the same for the whole household: while one is an Adult Table, the child does not get its card on the Welcome Screen, and that day or week neither extends nor breaks the child's Streak. Guest is never a Child Profile, so adult visitors see the whole collection. This is no parental control: nothing asks for a password.

### Menu Cleanup

Menu Cleanup lightens PinballY's menus for every Profile, Admin Profiles included: it removes Help and About from the Exit and Operator menus, Information, Flyer and Instruction Card from the main menu (Rate Table and Add to Favorites stay), PinballY's own High Scores entry (named **Table Scores** in the main menu) when the pack's High Scores are turned off, and the Filter by System, Filter by Last Played and Filter by Date Added groups from "Change Filter". It is the only feature **off by default**: turn it on with `ADD_ON_MENU_CLEANUP=true`. PinballY's dedicated buttons for these screens, if you mapped them, still work.

## Contributing

Module layout, conventions, tests, adding a language and resetting progress: see the [contributor guide](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
