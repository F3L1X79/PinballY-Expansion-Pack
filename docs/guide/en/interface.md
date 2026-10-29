# Interface

[← Guide index](index.md)

## PinballY in 6 languages

<img src="../../images/main_menu.png" alt="The drawn main menu in French, sorted into sections" width="400">

PinballY's own menus and messages in French, German, Spanish, Italian or Portuguese, as well as English. Pick the language in **Expansion Pack Settings**, or with `LANGUAGE` in `.env.local` (see [Settings](settings.md)).

## Drawn menus

PinballY's menus and other scripts' menus are drawn in the pack's Steamball look, with the same entries, sorted into sections, and the same buttons: the main menu, Exit, filters, power off, table setup, the Operator Menu, a game's pause, media capture (batch capture included) and confirmations.

- In the pause, Exit and "Cancel" resume the game.
- A shorter main menu gathers every wheel selection and filter group behind one "Change Filter" entry, and names the filter the wheel shows under its list ("Active filter: All Tables").

## Menu Cleanup

Menu Cleanup lightens PinballY's menus for every Profile, Admin Profiles included. It removes:

- Help and About from the Exit and Operator menus;
- Information, Flyer and Instruction Card from the main menu (Rate Table and Add to Favorites stay);
- PinballY's own High Scores entry (named **Table Scores** in the main menu) when the pack's High Scores are turned off;
- the Filter by System, Filter by Last Played and Filter by Date Added groups from "Change Filter".

It is the only feature **off by default**: turn it on with `ADD_ON_MENU_CLEANUP=true`. PinballY's dedicated buttons for these screens, if you mapped them, still work.

## On the wheel screen

- A clock, a gold arc under the wheel (the Wheel Arc) and a richer status line.
- The active Profile's badge with its Player Level, the week's Challenge Card and the Mastery Bar.

## Launches, waits and sounds

- Launches without a black flash, with a gold comet turning while you wait, the step under way written in gold beneath it while a table launches or closes ("Loading…", "Returning to tables…"): during a launch, at startup, while a high score board is read and while the Profile Stats, the Household Stats, the Achievement List or the Avatar Frame list get ready.
- The backglass hidden during a game.
- Sounds for launches, Achievements, greetings, confetti and fireworks, or your own (see [Settings](settings.md)).
