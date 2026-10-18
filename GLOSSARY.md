# PinballY Expansion Pack

Unofficial add-ons for the PinballY virtual pinball front end, built on its JavaScript scripting API: they help the player choose what to play, reward play with achievements, and polish the interface.

## Language

### Add-ons

**Add-on**:
A self-contained feature that `main.js` starts at launch and that the player can turn off in the configuration.
_Avoid_: plugin, script (a script is just a `.js` file)

### Menus

**Drawn Menu**:
A menu the player sees drawn in the pack's own style instead of PinballY's native one, with the same entries and the same effect when one is chosen: the menus a player meets (main, Exit, filter choices, power off), the table's setup and categories, the Operator Menu, and those the Add-ons open. The capture, media and elevation menus that look after the cabinet and the pause menu of a running game stay native, and so does every menu when the Add-on is turned off or a menu cannot be drawn. Shown simply as "menu".
_Avoid_: Steamball menu (Steamball is the palette), custom menu, popup (a popup shows information, a menu offers choices)

**Filter Picker**:
The submenu, opened by the player from the main menu's "Change Filter" entry, that lists the wheel selections (All Tables and the pack's own, each only while it has tables), then PinballY's filter groups (by era, manufacturer, category, rating, and the others the player kept), each opening PinballY's own list of filters for that group. Choosing a selection or a filter closes the menus on the filtered wheel. Back or Exit goes up one level at a time: from a group to the Filter Picker on that group, from the Filter Picker to the main menu on its entry. The current selection, and the group the Active Filter belongs to, are marked. Shown as "Changer de filtre" in French.
_Avoid_: Filter Tables, filter menu (each group's own list is a filter menu too), filter groups (the groups are what it lists)

**Active Filter**:
The filter the wheel applies right now, a wheel selection or a filter from one of PinballY's groups, named in the main menu: under its entries in a Drawn Menu ("Active filter: <name>"), on the entry itself in PinballY's native menu. Shown as "Filtre actif" in French.
_Avoid_: current filter, current selection

**Selection Marker**:
The soft gold glow around the current choice of a drawn screen (Welcome Screen, Profile Stats, Household Stats, the Avatar Frame list, and the Exit Button of the Achievement List and High Score Board), whose golds, from bronze to a white gleam, flow round it without end, always the same way, so the player sees at once where they are; it jumps straight to a new choice. Drawn Menus mark their selected entry their own way.
The choice it surrounds is the current (or highlighted) choice; only the glow itself is never called a highlight.
_Avoid_: halo (for the selection; a Rank emblem's or a Mastery square's halo stays a halo), cursor, highlight

**Exit Button**:
The button at the top right of every drawn screen (Welcome Screen, Profile Stats, Household Stats, Achievement List, Avatar Frame list, High Score Board) that does just what Exit does there, chosen like the screen's other choices. It shows a back arrow, its tooltip saying "Back", whenever Exit brings something back, a parent screen or a menu; and a cross, its tooltip saying "Close", only when Exit leaves the bare wheel. On a screen with no other choice it is always the current one. The screen's footer names the same word after the Exit key. Shown as "Retour" or "Fermer" in French.
_Avoid_: close cross, back button (it is one button whose look follows where Exit goes)

**Button Hints**:
The footer of a drawn screen that shows, as key caps followed by what they do, the player's buttons that act there: the flippers (browse, or scroll on a High Score Board longer than the window), Select (choose), and Exit, named with the Exit Button's word. A button that does nothing on that screen is left out. Shown under no title.
_Avoid_: help bar, legend

**Loader**:
A small gold comet that circles without end in the middle of the playfield screen, always in the same place (on the top third only over the High Score Board already shown), with no text nor backdrop, over whatever is already there, while something the player waits for gets ready: PinballY starting up until the Welcome Screen shows (over the wheel already dimmed for it), a table launching, or closing to go back to the wheel (never while it is played), the High Score Board while it reads a table's board afresh, and the Profile Stats, the Household Stats and the Achievement List (the Avatar Frame list too if it proves slow) while they get ready, over the wheel already dimmed for them, and only if they are not ready within a moment; the screen then fades in whole, and Exit meanwhile gives up opening it. It only shows where it can keep turning, never on a screen drawn all at once, nor when the Welcome Screen comes back after Change Player, nor when Exit goes back to the screen the player came from (the Profile Stats or the Household Stats), which comes back at once as it was left, unless an Avatar Frame equipped meanwhile changed it. While a table launches or closes, the step under way is written in gold just beneath it ("Chargement en cours…", "Retour aux tables…"); that text belongs to the launch, not to the Loader. It never takes the player's buttons. Shown as "Indicateur de chargement" in French.
_Avoid_: spinner, loading screen, splash screen (it is not a screen, only a ring over the current one)

### Wheel

**Wheel Arc**:
The gold arc drawn under the wheel's icons and following its curve, shown by default unless the player has their own decoration there. Shown as "arc de la roue" in French.
_Avoid_: underlay (PinballY's name for the image layer that carries it), wheel colour

### Profiles

**Profile**:
The identity a player picks so that their plays and Achievements count for them; no password, anyone can pick any Profile from the main menu. The active Profile stays active across restarts until another one is picked, unless the Profile picker is turned off: Guest is then active at startup. Plays count only for the active Profile, even when several people share one game.
_Avoid_: account, user, login

**Guest**:
The Profile that always exists and cannot be removed; it is the active Profile until another one is picked, and whenever the Profile picker is turned off. Its plays, Achievements and Challenge progress stay its own when a player who played as Guest creates a Profile: nothing moves over.
_Avoid_: default user, anonymous

**Household**:
Every Profile of the cabinet except Guest, Child Profiles included, whether or not it has played. Shown as "la maison" in French.
_Avoid_: family, all players, users

**Admin Profile**:
A Profile marked as one of those who look after the cabinet: only Admin Profiles see the setup entries of the menus, and only they find the Profile Reset in the Exit menu. While no Profile is marked, every Profile sees everything. Guest is never one.
_Avoid_: administrator, operator (the operator is whoever holds the coin door key)

**Child Profile**:
A Profile marked as a child's: Adult Tables are left out of everything it can pick a table from, Period Tables included: while a Period Table is an Adult Table, it is not offered to a Child Profile at all. Not parental control: nothing asks for a password. Guest is never one.
_Avoid_: kid mode, parental control, family filter

**Profile Reset**:
Starting a Profile over as if it had never played: its plays, Play Log (and so its Daily Streak), Period Table Streaks, session stats, Random Games, Challenge progress and Notified Achievements are erased, after a dated copy of its former data is kept, while its name, Avatar and marks stay. Only an Admin Profile can reset one, or every Profile at once (Guest and itself included), and never while no Profile is an Admin Profile.
_Avoid_: fresh start, wipe, achievement reset (the Achievements come from the plays, so the plays go too)

**Avatar**:
The picture that stands for a Profile.
_Avoid_: profile picture, photo

**Profile Greeting**:
The short greeting, with the Avatar and the Profile's name, shown when a Profile is picked and when PinballY starts, so the player knows whose plays will count. It gives way to the Welcome Screen whenever that screen shows, since it greets the Profile itself, and the screen then plays its sound.
_Avoid_: welcome toast, login message

**Play**:
A game of at least one minute on a table, which counts for the Profile active when it started. A shorter game is a launch by mistake and counts for nothing, except for the Rage Quit Achievement, which notices a game given up early without making it a Play.
_Avoid_: session (the session stats count only Plays, except the Rage Quit flag), launch (a launch becomes a Play only after a minute)

**Play Log**:
The dated list of a Profile's Plays: when each started, which table, and how long it lasted, kept year by year. It starts empty on the day it is introduced: earlier games are known only by their totals. Shown to no one yet; it feeds later summaries such as a yearly one.
_Avoid_: Game Log, play history, journal

**Daily Streak**:
The number of consecutive calendar days, up to today, in which the active Profile started at least one Play, on any table, however it was launched; a day without one breaks it, with no day of grace, but it is still alive all day long as long as yesterday counted. Read from the Play Log, so the days before it was introduced do not count. Shown as "Jours d'affilée sur la borne" in French.
_Avoid_: Streak (alone: a Period Table Streak belongs to a Period Table), login streak, visit streak

**Profile Stats**:
The screen, opened by the player from the main menu, that sums up the active Profile's own plays (or, opened from the Household Stats, another Household Profile's, only to look at): games played, total time, its Player Level and Collection Mastery, average game length, favourite manufacturer (community tables aside), decade and table, its first table played, collection completion, Achievements Unlocked, Daily Streak, Period Table Streaks, completed Challenges, and the way to its Hall of Fame and Tables to Discover. Shown as "Statistiques" in French, opened from "Vos statistiques" ("Your Stats").
_Avoid_: Pinball Profile, player card, profile screen (a Profile is the identity, not the screen)

**Household Stats**:
The screen, opened from the Profile Stats, that sets the Household's Profiles side by side, one column each (the active Profile first, then in the Profile picker's order), on the stats where more is better: Player Level, Collection Mastery, Achievements Unlocked, games played, total time, Daily Streak and completed Challenges; the best of each line is in gold, every Profile tied for it too, and a line where nobody has anything has none. Each column shows the Profile's Avatar, in its Avatar Frame, and name. Picking a column opens that Profile's Profile Stats. Offered once the Household has two Profiles, to Guest too, which has no column of its own. Shown as "Statistiques de la maison" in French, opened from "La maison".
_Avoid_: leaderboard, ranking, comparison

**Profile Reward**:
Something a Profile unlocks through play and then chooses to wear; today only Avatar Frames, of which it wears at most one. Every Profile has them, Guest and Child Profiles included. Unlocked rewards follow what earned them and are never kept apart from it, so a Profile Reset takes them back and the Profile wears none again. Chosen from the Profile Stats, where the rewards still to unlock show with what unlocks them. Shown as "récompense" in French.
_Avoid_: cosmetic, unlockable, skin

**Avatar Frame**:
A frame drawn around the Avatar wherever it is shown, one for each Collection Tier from 1 to 10, unlocked by reaching that tier, each with a theme of its own (an enchanted forest, steam and gears, a celestial legend…) rather than the colour of a Mastery Level, and reaching a quarter of the Avatar's size beyond it on every side; a new Avatar Frame is announced by a line in the toast of its Collection Tier, and the first one a Profile unlocks is followed by a Reward Prompt; none is worn until the player equips it. A Profile that wears none keeps each place's usual look. It is not the gold ring that marks the selected Avatar in the Profile picker, which stays around it. The Player Level pip stays on top of it, in its corner. Shown as "cadre" in French.
_Avoid_: skin, border, badge (the Profile badge is the Avatar shown at the top right of the wheel screen), gold frame

**Reward Prompt**:
The dialog that follows the toast of a Profile's first Avatar Frame, once: it names the frame and says where to equip it (Your Stats, then Frame), with a "Go equip it" button that opens that list and a "Got it" button that closes it; it never comes back, equipped or not. Later frames get only their toast line. A Profile Reset brings it back with the next first reward. Waits its turn after the Welcome Screen and before the rating prompt.
_Avoid_: popup, notification, reward toast (a toast never waits for the player)

### Choosing what to play

**Period**:
A calendar span, either a day or a week (Monday to Sunday), during which a Period Table stays the same.
_Avoid_: timeframe, cycle

**Period Table**:
A table picked once per Period and kept for the whole Period, offered to the player as a suggestion. The same for every Profile. Never the previous Period's table, unless it is the only one.
_Avoid_: daily pick, featured table, table of period

**Adult Table**:
A table in the PinballY category set aside for adults ("NSFW" unless configured otherwise). A Child Profile never sees one, and it counts in none of its groups for completion Achievements.
_Avoid_: NSFW table, hidden table (one of the Hidden Tables, PinballY's own flag for the whole cabinet; only the Adult Table category keeps a table from a Child Profile)

**Table of the Day**:
The Period Table whose Period is a day; prefers tables never played, otherwise the one played longest ago.

**Table of the Week**:
The Period Table whose Period is a week; picked purely at random.

**Welcome Screen**:
The screen shown over the dimmed wheel when PinballY starts, and again after Change Player picked another Profile, that greets the active Profile by its Avatar and name, tells it its Lost Records, shows the Table of the Day and the Table of the Week with what they mean for that Profile, and offers to stay on the table selected on the wheel, to change player or to launch a Period Table or a Random Game. While it is open, toasts and Confetti Showers wait for it to close. Shown as "Écran d'accueil" in French.
_Avoid_: startup prompt, splash screen, dialog (it does more than ask a question)

**Last Played Table**:
The table of the active Profile's most recent Play, across the whole collection, however it was launched.

**Random Game**:
A table drawn at random from the current wheel selection and launched right away; never the Last Played Table, unless it is the only one in the selection.
_Avoid_: random table, lucky pick

**Tables to Discover**:
The tables the active Profile can see that it has never played, offered as a wheel selection from the Filter Picker and from the Profile Stats. Shown as "Tables à découvrir" in French.
_Avoid_: never played tables, unplayed tables, new tables

**Hall of Fame**:
The ten tables the active Profile can see that it has spent the most time on, ranked from the most played, offered as a wheel selection from the Filter Picker. Shown as "Most Played Tables" ("Tables les plus jouées" in French), like the same tables in the Profile Stats.
_Avoid_: top played, most played, leaderboard

**My High Scores**:
The tables the active Profile can see on whose high score board it still holds a High Score, ranked by the best place it holds there, then by title, offered as a wheel selection from the Filter Picker, right under the Hall of Fame; the entry is in the Filter Picker only while there is at least one. Shown as "Mes meilleurs scores" in French.
_Avoid_: my records, Mes records (a record is only the Table Record)

**Favorite Tables**:
The tables the household has added to PinballY's favourites, offered as a wheel selection from the Filter Picker, right under My High Scores. Shown as "Tables favorites" in French.
_Avoid_: Favorites, favourites filter

**Hidden Tables**:
The tables carrying PinballY's Hidden flag, for the whole cabinet, offered to every Profile as a wheel selection from the Filter Picker, right under the Favorite Tables, Adult Tables left out for a Child Profile; the entry is in the Filter Picker only while at least one table is hidden. A Hidden Table is not one a Profile can see: it is left out of every other selection and list. Shown as "Tables masquées" in French.
_Avoid_: masked tables, operator tables

**Period Table Streak**:
The number of consecutive Periods in which the active Profile made a Play on the Period Table that started during its Period, however it was launched. A Period whose Period Table is an Adult Table neither extends nor breaks a Child Profile's Period Table Streak.
_Avoid_: Streak (alone: the Daily Streak is another one), combo, chain

**Periods Played**:
The total number of Periods, consecutive or not, in which the active Profile made a Play on the Period Table that started during its Period, however it was launched. Never lower than the longest Period Table Streak.
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
The tables the active Profile can see that would move its Challenge forward if played now, offered as a wheel selection from the Filter Picker, right under "All Tables"; only some Challenges have them, for example not one about total play time. The entry is in the Filter Picker only while the active Profile's Challenge has Challenge Tables, so neither once the Challenge is completed nor for a Challenge without any; when none is left while they are on the wheel, every table comes back.
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

**Collection Mastery**:
How far a Profile has taken its tables, tier by tier: its Collection Tier is the highest Mastery Level that ten of the tables it can see have reached, starting at 0, and its progress is how many tables, out of ten, have reached the next one. A Profile that can see fewer than ten tables needs all of them. Ten tables at Mastery Level 10 is the end. A tier reached is lost only by a Profile Reset. Shown as "Maîtrise de la collection" in French.
_Avoid_: global mastery, player level (the player's level comes from Achievement Ranks), completion (a completion Achievement covers a group of tables)

**Collection Tier**:
The step of Collection Mastery, from 0 to 10: tier N means ten tables at Mastery Level N or above. Shown as "palier" in French.
_Avoid_: level (a Mastery Level belongs to one table), stage, rank (an Achievement Rank is how hard an Achievement is)

**Mastery Bar**:
The small panel at the top right of the wheel screen, under the Challenge Card or in its place when there is none, that keeps in view the active Profile's Table Mastery of the selected table: its bar fills toward the next Mastery Level in the colour of the level reached, whose name heads the panel and whose number sits in a square at the bar's end. For a table never played it stays empty, with no number, under "À découvrir" ("To discover"). It lights up once when a Play has moved it forward, and is hidden while a game runs.
_Avoid_: level bar, progress bar (alone), mastery widget, Mastery Card

**Mastery Toast**:
A toast like the Achievement Toast, but with its own colour and no trophy, that announces the Mastery Level, by its name and number, that the active Profile has just reached on a table; one only per Play, for the highest level reached.
_Avoid_: level-up popup, mastery achievement (Table Mastery has no Achievement)

### High Scores

**High Score**:
A place on a table's own high score board that a Profile won with a Play: a score that was not on the board before the Play goes to the Profile active when the Play started, Guest and Child Profiles included, whatever initials were typed and even when several players shared the game. Only a score counts, not a feat such as a number of combos or castles. The scores already on the board when the pack first reads it are Default Scores, for good. A High Score once won stays won even when better scores push it off the board, and a Profile Reset does not take it away; only removing the Profile does, and the score then becomes a Default Score. Shown as "meilleur score" in French.
_Avoid_: record (the Table Record is only the best one), hi-score, score (the score of a game that did not reach the board is never known)

**Default Score**:
A score that was already on a table's high score board when the pack first read it, whoever really set it, or a High Score whose Profile was removed since: it belongs to no Profile, for good (a Profile later created under the removed one's name gets its High Scores back, accepted), and only its initials are shown, with the placeholder image they pick on the High Score Board (the same for the same initials on every table). Shown as "score par défaut" in French.
_Avoid_: original score (confused with original tables), anonymous score, factory score (not all of them come from the factory)

**Table Record**:
The best score on a table's high score board, whoever holds it, an anonymous one included. Shown as "record" in French.
_Avoid_: Grand Champion (the name only some tables give it), world record

**Lost Record**:
A Table Record a Profile held that another Profile, Guest included, beat with a Play since the Welcome Screen last showed it that Profile's Lost Records; Child Profiles lose and take them like any other, Guest never has any. The Welcome Screen tells the Profile once, in a single line naming who took each one (the three most recent, then how many more), and then never again; it is dropped as soon as the Profile holds that Table Record again, when the Profile that took it is removed, and while the table is not one the Profile can see. Shown as "record perdu" in French.
_Avoid_: rivalry (the feature, not the record), stolen record, notification

**High Score Toast**:
A toast like the Mastery Toast, with its own colour and no trophy, the place won in its tile, that announces the best place a Play won on a table's high score board, or the Table Record when that place is the first, naming the Profile it was taken from, Guest included, when another one held it; one only per Play, after the other toasts of that Play. No board opens by itself. Shown as "Meilleur score" in French.
_Avoid_: high score popup, record toast

**High Score Board**:
The drawn screen, opened by the player from the main menu, that shows the selected table's high score board with each place's owner: the three first places on a podium (the Table Record in the middle and highest), the others in rows below, each with its rank, score, initials, and the Profile that won it (name and Avatar) or "Default score". Not a table's own board, which it shows. Shown as "Meilleurs scores" in French.
_Avoid_: high scores popup, leaderboard

### Achievements

**Achievement**:
A milestone the player reaches through play, announced once with an Achievement Toast.
_Avoid_: trophy, badge, success

**Achievement Toast**:
A small card in the bottom-right corner of the playfield screen that announces one Achievement, shown in the colour of its Achievement Rank with that Rank's emblem: it rises from the bottom edge, stays a few seconds, then fades away on its own. It never waits for the player nor takes their input, and shows over everything, menus included, except the Welcome Screen, which it waits for. Several toasts stack, the newest at the bottom pushing the older ones up.
_Avoid_: popup, notification, dialog (a dialog waits for the player)

**Unlocked**:
An Achievement whose condition holds right now. It can be lost again, for example when a table joins a completed group; losing it does not announce it a second time when it comes back. An Achievement on a Period Table Streak or on the Daily Streak is the exception: the longest one unlocks it, so a broken streak never takes it back.
_Avoid_: earned, obtained

**Achievement List**:
The screen, opened by the player, that shows every Achievement in one scrolling list of two sections: the Unlocked ones, the most recently Notified at the top, then the missing ones, the highest Unlock Rate first. Each Achievement shows its Achievement Rank. Shown as "Succès personnels" in French, opened from "Vos succès" ("Your Achievements").
_Avoid_: My Achievements, trophy room

**Achievement Family**:
A kind of Achievement, absent as a whole when the Add-on it depends on is turned off: Collection, Play Time, Period Tables, Sessions, Random Game, Manufacturers, Decades, Categories, Challenges, Surprises. Surprises gathers Secret Achievements that hang on no Add-on but the Achievements themselves, such as a Play started at an unusual hour. Period Tables gathers every Achievement about playing the Table of the Day or the Table of the Week (first play, total Periods played, Period Table Streaks).
_Avoid_: group (a group is the set of tables a completion Achievement covers, such as one manufacturer's tables), category (a PinballY table category)

**Notified**:
An Achievement whose Achievement Toast has started showing. Toasts still waiting while a game runs are not Notified yet.
_Avoid_: acknowledged, seen, unlocked (an Achievement can be unlocked but not yet Notified)

**Achievement Rank**:
How hard an Achievement is: Bronze, Silver, Gold or Platinum. Every Achievement has one, whether Unlocked or missing.
_Avoid_: tier, level, difficulty, grade

**Player Level**:
How far a Profile has come as a player, earned through the Achievement Ranks of its Notified Achievements, each Rank worth more than the one below; each level takes more to reach than the one before, with no last level, so a bigger collection, which has more Achievements, lets a Profile climb higher. A Child Profile's points are scaled up by as much as the Achievements it is kept from (Adult Tables, Achievements a child never gets) would have given a Profile that is not a child, so that it climbs as fast as an adult. Levels have no names, only a number. It is worked out afresh from the Notified Achievements each time: an Achievement no longer Unlocked keeps its points, but a level can drop when a Notified Achievement is worth less (a smaller group lowers a group completion's Rank) or is gone (its Add-on turned off), and a Profile Reset starts it over. Besides the Profile Stats, it shows as a small round pip at the corner of the Avatar (on the Profile badge, the Welcome Screen and each Avatar of the Profile picker, in the same proportions), in a metal that climbs with the level (Bronze from 1, Silver from 5, Gold from 10, Platinum from 20, a little lighter at each level in between; the Level Toast and the Profile Stats card take the same metal), the Welcome Screen's with the level shown when the screen is drawn; the badge's pip takes a new level when its Level Toast starts, and shows a drop only at the next Profile switch or startup. Shown as "Niveau" in French.
_Avoid_: XP, player rank (an Achievement Rank is how hard an Achievement is), level (alone: a Mastery Level belongs to one table), Collection Tier

**Level Toast**:
A toast like the Achievement Toast, but with its own colour and no trophy, that announces the Player Level the active Profile has just reached, after the Achievement Toasts that brought it; one only per return to the wheel, for the highest level reached. It comes with the Fireworks, and when the same return brings a Confetti Shower, both start a second before the shower ends. Any rise after a Play is announced, even back to a level reached before and lost; a level a Profile already had when PinballY started, or when the Player Level first appeared, is not.
_Avoid_: level-up popup, rank-up

**Confetti Shower**:
A shower of coloured confetti released all at once from above the wheel screen, falling down across all of it, in front of everything, toasts and menus included (it waits for the Welcome Screen to close), to celebrate along with the toast of a completed Challenge, of a Platinum Achievement, of Mastery Level 10 or of a Collection Tier completed; one shower only when the same return to the wheel brings several. It never waits for the player nor takes their input, and vanishes at once when a table launches or attract mode starts. Shown as "Pluie de confettis" in French.
_Avoid_: celebration, party, fireworks (Fireworks celebrate a Player Level)

**Fireworks**:
Rockets shot up from the bottom of the wheel screen that burst into rings of glowing streaks, in colours that change from one burst to the next, in front of everything like the Confetti Shower, to celebrate along with the Level Toast; the same show whatever the level reached. It never waits for the player nor takes their input, and vanishes at once when a table launches or attract mode starts. Shown as "Feu d'artifice" in French.
_Avoid_: confetti, celebration, level-up effect

**Unlock Rate**:
How many of the Household's Profiles have been Notified of an Achievement, shown on the Achievement List by the Avatars of the Profiles other than the active one. It is not shown while there is only one Profile besides Guest.
_Avoid_: rarity (a rare Achievement has a low Unlock Rate), household rate, global percentage

**Achievement Progress**:
How far the active Profile is from a missing Achievement: the very value its unlock condition tests, against the target that unlocks it (for a Period Table Streak or the Daily Streak, the current one: a missing Achievement on it starts over from 0 when it breaks). Only Achievements with a counted target of at least 2 have one, unless that value starts over at every game, like a tour of the wheel; an Unlocked Achievement shows none.
_Avoid_: progress (alone), completion (a completion Achievement covers a group of tables)

**Secret Achievement**:
An Achievement whose title and description stay out of sight while it is missing: the Achievement List shows "???" and a hint in their place, with its Achievement Rank, Unlock Rate and order as for any other. Once Unlocked, its Achievement Toast and row show it like any other. Only standalone Achievements can be secret, never one of a series of thresholds nor a group completion, which are goals to aim at. Shown as "Succès secret" in French.
_Avoid_: hidden achievement (Hidden is PinballY's own flag for tables), mystery achievement
