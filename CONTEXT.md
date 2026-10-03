# PinballY Expansion Pack

Unofficial add-ons for the PinballY virtual pinball front end, built on its JavaScript scripting API: they help the player choose what to play, reward play with achievements, and polish the interface.

## Language

### Add-ons

**Add-on**:
A self-contained feature that `main.js` starts at launch and that the player can turn off in the configuration.
_Avoid_: plugin, script (a script is just a `.js` file)

### Profiles

**Profile**:
The identity a player picks so that their plays and Achievements count for them; no password, anyone can pick any Profile from the main menu. The active Profile stays active across restarts until another one is picked, unless the Profile picker is turned off: Guest is then active at startup. Plays count only for the active Profile, even when several people share one game.
_Avoid_: account, user, login

**Guest**:
The Profile that always exists and cannot be removed; it is the active Profile until another one is picked, and whenever the Profile picker is turned off. Its plays, Achievements and Challenge progress stay its own when a player who played as Guest creates a Profile: nothing moves over.
_Avoid_: default user, anonymous

**Admin Profile**:
A Profile marked as one of those who look after the cabinet: only Admin Profiles see the setup entries of the menus, and only they find the Profile Reset in the Exit menu. While no Profile is marked, every Profile sees everything. Guest is never one.
_Avoid_: administrator, operator (the operator is whoever holds the coin door key)

**Child Profile**:
A Profile marked as a child's: Adult Tables are left out of everything it can pick a table from, Period Tables included: while a Period Table is an Adult Table, it is not offered to a Child Profile at all. Not parental control: nothing asks for a password. Guest is never one.
_Avoid_: kid mode, parental control, family filter

**Profile Reset**:
Starting a Profile over as if it had never played: its plays, Play Log, Streaks, session stats, Random Games, Challenge progress and Notified Achievements are erased, after a dated copy of its former data is kept, while its name, Avatar and marks stay. Only an Admin Profile can reset one, or every Profile at once (Guest and itself included), and never while no Profile is an Admin Profile.
_Avoid_: fresh start, wipe, achievement reset (the Achievements come from the plays, so the plays go too)

**Avatar**:
The picture that stands for a Profile.
_Avoid_: profile picture, photo

**Profile Greeting**:
The short greeting, with the Avatar and the Profile's name, shown when a Profile is picked and when PinballY starts, so the player knows whose plays will count. At startup it gives way to the startup prompt, which greets the Profile by name itself.
_Avoid_: welcome toast, login message

**Play**:
A game of at least one minute on a table, which counts for the Profile active when it started. A shorter game is a launch by mistake and counts for nothing, except for the Rage Quit Achievement, which notices a game given up early without making it a Play.
_Avoid_: session (the session stats count only Plays, except the Rage Quit flag), launch (a launch becomes a Play only after a minute)

**Play Log**:
The dated list of a Profile's Plays: when each started, which table, and how long it lasted, kept year by year. It starts empty on the day it is introduced: earlier games are known only by their totals. Shown to no one yet; it feeds later summaries such as a yearly one.
_Avoid_: Game Log, play history, journal

**Profile Stats**:
The screen, opened by the player from the main menu, that sums up the active Profile's own plays: games played, total time, favourite manufacturer and decade, most played and never played tables, collection completion, Achievements Unlocked, and Streaks. Shown as "Statistiques" in French, opened from "Vos statistiques" ("Your Stats").
_Avoid_: Pinball Profile, player card, profile screen (a Profile is the identity, not the screen)

### Choosing what to play

**Period**:
A calendar span, either a day or a week (Monday to Sunday), during which a Period Table stays the same.
_Avoid_: timeframe, cycle

**Period Table**:
A table picked once per Period and kept for the whole Period, offered to the player as a suggestion. The same for every Profile. Never the previous Period's table, unless it is the only one.
_Avoid_: daily pick, featured table, table of period

**Adult Table**:
A table in the PinballY category set aside for adults ("NSFW" unless configured otherwise). A Child Profile never sees one, and it counts in none of its groups for completion Achievements.
_Avoid_: NSFW table, hidden table (Hidden is PinballY's own flag, for the whole cabinet)

**Table of the Day**:
The Period Table whose Period is a day; prefers tables never played, otherwise the one played longest ago.

**Table of the Week**:
The Period Table whose Period is a week; picked purely at random.

**Last Played Table**:
The table of the active Profile's most recent Play, across the whole collection, however it was launched.

**Random Game**:
A table drawn at random from the current wheel selection and launched right away; never the Last Played Table, unless it is the only one in the selection.
_Avoid_: random table, lucky pick

**Hall of Fame**:
The ten tables the active Profile can see that it has spent the most time on, ranked from the most played, offered as a wheel selection from the main menu. Shown as "Most Played Tables" ("Tables les plus jouées" in French), like the same tables in the Profile Stats.
_Avoid_: top played, most played, leaderboard

**Favorite Tables**:
The tables the household has added to PinballY's favourites, offered as a wheel selection from the main menu, right under the Hall of Fame. Shown as "Tables favorites" in French.
_Avoid_: Favorites, favourites filter

**Streak**:
The number of consecutive Periods in which the active Profile made a Play on the Period Table that started during its Period, however it was launched. A Period whose Period Table is an Adult Table neither extends nor breaks a Child Profile's Streak.
_Avoid_: combo, chain

**Periods Played**:
The total number of Periods, consecutive or not, in which the active Profile made a Play on the Period Table that started during its Period, however it was launched. Never lower than the longest Streak.
_Avoid_: exploration count, total streak

**Day's Manufacturers**:
The distinct non-empty manufacturers of the tables of the Plays started during one calendar day, however they were launched, hidden tables included.

### Challenges

**Challenge**:
A casual play goal set for one week, the same for every Profile, Guest included, such as playing five different Stern tables; each Profile's own progress counts only Plays on tables it can see, started during the week, and the Challenge is completed or missed when the week ends. Shown as "Défi" in French.
_Avoid_: quest, goal, mission, Achievement (an Achievement is a permanent milestone)

**Challenge Card**:
The small card at the top right of the wheel screen, under the Profile badge when there is one, that keeps the week's Challenge and the active Profile's progress always in view; when there is something new, such as progress or the previous week's verdict, its content changes in place.
_Avoid_: challenge widget, challenge popup, status line

**Challenge Tables**:
The tables the active Profile can see that would move its Challenge forward if played now, offered as a wheel selection from the main menu, right under "All Tables"; only some Challenges have them, for example not one about total play time. The entry is always in the main menu: chosen with no Challenge Tables, or when none is left while they are on the wheel, every table comes back.
_Avoid_: challenge filter, eligible tables

**Challenge Toast**:
A toast like the Achievement Toast, but with its own colour and no trophy, that announces that the active Profile completed the week's Challenge.
_Avoid_: challenge popup, challenge achievement

### Table Mastery

**Table Mastery**:
How well a Profile knows one table, measured only by the time its Plays on that table have lasted (a game shorter than a minute adds nothing). A progression of its own, with no Achievement, started over by a Profile Reset. Shown as "Maîtrise" in French.
_Avoid_: XP, table level, experience

**Mastery Level**:
The step of Table Mastery a Profile has reached on a table, from 1 at its first Play up to 10, each step taking longer to reach than the one before. Shown as a number with a name that suits any player, from Novice (Rookie) at 1 to Mage du flipper (Pinball Wizard) at 10, both more and more brilliant from one level to the next.
_Avoid_: level (alone: the player's level is another thing), rank (an Achievement Rank is how hard an Achievement is), tier

**Mastery Bar**:
The small panel at the top right of the wheel screen, under the Challenge Card or in its place when there is none, that keeps in view the active Profile's Table Mastery of the selected table: its bar fills toward the next Mastery Level in the colour of the level reached, whose name heads the panel and whose number sits in a square at the bar's end. For a table never played it stays empty, with no number, under "À découvrir" ("To discover"). It lights up once when a Play has moved it forward, and is hidden while a game runs.
_Avoid_: level bar, progress bar (alone), mastery widget, Mastery Card

**Mastery Toast**:
A toast like the Achievement Toast, but with its own colour and no trophy, that announces the Mastery Level, by its name and number, that the active Profile has just reached on a table; one only per Play, for the highest level reached.
_Avoid_: level-up popup, mastery achievement (Table Mastery has no Achievement)

### Achievements

**Achievement**:
A milestone the player reaches through play, announced once with an Achievement Toast.
_Avoid_: trophy, badge, success

**Achievement Toast**:
A small card in the bottom-right corner of the playfield screen that announces one Achievement: it rises from the bottom edge, stays a few seconds, then fades away on its own. It never waits for the player nor takes their input, and shows over everything, menus included. Several toasts stack, the newest at the bottom pushing the older ones up.
_Avoid_: popup, notification, dialog (a dialog waits for the player)

**Unlocked**:
An Achievement whose condition holds right now. It can be lost again, for example when a table joins a completed group; losing it does not announce it a second time when it comes back. A Streak Achievement is the exception: the longest Streak unlocks it, so a broken Streak never takes it back.
_Avoid_: earned, obtained

**Achievement List**:
The screen, opened by the player, that shows every Achievement in one scrolling list of two sections: the Unlocked ones, the most recently Notified at the top, then the missing ones, the highest Unlock Rate first. Each Achievement shows its Achievement Rank. Shown as "Succès personnels" in French, opened from "Voir vos succès" ("Your Achievements").
_Avoid_: My Achievements, trophy room

**Achievement Family**:
A kind of Achievement, absent as a whole when the Add-on it depends on is turned off: Collection, Play Time, Period Tables, Sessions, Random Game, Manufacturers, Decades, Categories, Challenges, Surprises. Surprises gathers Secret Achievements that hang on no Add-on but the Achievements themselves, such as a Play started at an unusual hour. Period Tables gathers every Achievement about playing the Table of the Day or the Table of the Week (first play, total Periods played, Streaks).
_Avoid_: group (a group is the set of tables a completion Achievement covers, such as one manufacturer's tables), category (a PinballY table category)

**Notified**:
An Achievement whose Achievement Toast has started showing. Toasts still waiting while a game runs are not Notified yet.
_Avoid_: acknowledged, seen, unlocked (an Achievement can be unlocked but not yet Notified)

**Achievement Rank**:
How hard an Achievement is: Bronze, Silver, Gold or Platinum. Every Achievement has one, whether Unlocked or missing.
_Avoid_: tier, level, difficulty, grade

**Confetti Shower**:
A shower of coloured confetti released all at once from above the wheel screen, falling down across all of it, in front of everything, toasts and menus included, to celebrate along with the toast of a completed Challenge, of a Platinum Achievement or of Mastery Level 10; one shower only when the same return to the wheel brings several. It never waits for the player nor takes their input, and vanishes at once when a table launches or attract mode starts. Shown as "Pluie de confettis" in French.
_Avoid_: celebration, party, fireworks

**Unlock Rate**:
How many of the household's Profiles (Guest excepted) have been Notified of an Achievement, shown on the Achievement List by the Avatars of the Profiles other than the active one. It is not shown while there is only one Profile besides Guest.
_Avoid_: rarity (a rare Achievement has a low Unlock Rate), household rate, global percentage

**Achievement Progress**:
How far the active Profile is from a missing Achievement: the very value its unlock condition tests, against the target that unlocks it (for a Streak, the current Streak: a missing Streak Achievement starts over from 0 when the Streak breaks). Only Achievements with a counted target of at least 2 have one, unless that value starts over at every game, like a tour of the wheel; an Unlocked Achievement shows none.
_Avoid_: progress (alone), completion (a completion Achievement covers a group of tables)

**Secret Achievement**:
An Achievement whose title and description stay out of sight while it is missing: the Achievement List shows "???" and a hint in their place, with its Achievement Rank, Unlock Rate and order as for any other. Once Unlocked, its Achievement Toast and row show it like any other. Only standalone Achievements can be secret, never one of a series of thresholds nor a group completion, which are goals to aim at. Shown as "Succès secret" in French.
_Avoid_: hidden achievement (Hidden is PinballY's own flag for tables), mystery achievement
