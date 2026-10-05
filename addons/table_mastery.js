// ============================================================
// Table Mastery: shows the Mastery Bar of the selected table for the
// active Profile, computed from the Profile store's table totals (no data
// of its own). The bar sits under the Challenge Card when the card shows,
// in its place otherwise, and under the Profile badge when the Profile
// picker is on. Follows "gameselect", hides on "gamestarted", comes back
// on "wheelmode" and follows Profile switches. After a Play that moved a
// table's bar forward (onPlay, ADR 0008), lights it up once on the return
// to the wheel; after one that reached a new Mastery Level, submits a
// Mastery Toast for the highest one, with the Confetti Shower at level 10.
// After one that raised the Collection Tier above the one kept in the
// Profile's profile.json ("collectionTier"), keeps the new tier there and
// submits its Mastery Toast, with the Confetti Shower unless a level 10
// toast of the same Play brings it.
// ============================================================

import { createPinballYHost } from "../common/pinbally_host.js";
import { getProfileStore } from "../common/profile_store.js";
import { getDrawingAhead } from "../common/drawing_ahead.js";
import { getChallenges } from "../common/challenge.js";
import { BADGE_HEIGHT, challengeCardCanvasHeight } from "../common/challenge_card.js";
import { createMasteryBar } from "../common/mastery_bar.js";
import {
    masteryOf, movedByPlay, levelReachedByPlay, metalOf, collectionMasteryOfProfile, MAX_MASTERY_LEVEL,
} from "../common/table_mastery.js";
import { tablesVisibleTo } from "../common/visible_tables.js";
import { getAchievementToasts, TOAST_KIND } from "../common/achievement_toast.js";
import lang from "../common/i18n.js";
import { safeHandler } from "../common/safe_handler.js";
import config from "../common/config.js";

const SCRIPT_NAME = "TableMastery";

export default function init() {
    const host = createPinballYHost();
    const store = getProfileStore();
    const underBadge = config.addOns.profilePicker !== false;
    const withChallenges = config.addOns.challenges !== false;

    // What the Challenge Card draws from: the card has already followed the
    // same events, since the Challenges Add-on starts before this one.
    function cardHeight() {
        const view = withChallenges && getChallenges().getActiveView();
        return view ? challengeCardCanvasHeight(host, view.challenge) : 0;
    }
    const topOf = () => (underBadge ? BADGE_HEIGHT : 0) + cardHeight();
    const bar = createMasteryBar(host, getDrawingAhead(), { topOf });
    // Got at startup, so the Confetti Shower its toasts start is drawn
    // ahead by then.
    const toasts = getAchievementToasts();
    let gameRunning = false;
    // The Play that moved its table's bar forward, until the next return
    // to the wheel: { profileName, configId }.
    let movedTable = null;

    function showTable(game) {
        if (gameRunning || !game) {
            bar.hide();
            return;
        }
        bar.show(masteryOf(store.getPlay(game.configId)));
    }

    const showCurrent = () => showTable(host.getCurrentTable());

    // Lit up only when the wheel comes back on the very table that moved,
    // for the Profile that played it.
    function showOnReturn() {
        const moved = movedTable;
        movedTable = null;
        const game = host.getCurrentTable();
        // A Profile Reset since the Play leaves no mastery to light up.
        const mastery = game && masteryOf(store.getPlay(game.configId));
        if (moved && mastery && game.configId === moved.configId && store.getActiveProfile().name === moved.profileName) {
            bar.lightUp(mastery);
        } else {
            showTable(game);
        }
    }

    // Profile Resets so far, by Profile name in lower case (Profile names
    // ignore case): a toast submitted before its Profile's reset is stale.
    const resetCounts = new Map();
    const resetCountOf = profileKey => resetCounts.get(profileKey) || 0;
    store.onUpdate(safeHandler(SCRIPT_NAME, (profileName, { isReset }) => {
        if (isReset) resetCounts.set(profileName.toLowerCase(), resetCountOf(profileName.toLowerCase()) + 1);
    }));

    // toast: what a Mastery Toast shows, submitted for the named Profile and
    // dropped when that Profile is reset or no longer active at its turn.
    function submitFor(profileName, toast) {
        const profileKey = profileName.toLowerCase();
        const resetCount = resetCountOf(profileKey);
        toasts.submit({
            kind: TOAST_KIND.MASTERY,
            ...toast,
            onShown() {},
            isStale: () => resetCountOf(profileKey) !== resetCount
                || store.getActiveProfile().name.toLowerCase() !== profileKey,
        });
    }

    function announceLevel(profileName, configId, level) {
        const table = host.getGameInfo(configId);
        const TEXT = lang.tableMastery;
        submitFor(profileName, {
            accent: metalOf(level),
            tileNumber: level,
            title: TEXT.toastTitle(TEXT.levelNames[level - 1], level),
            description: table ? table.title : configId,
            celebrate: level === MAX_MASTERY_LEVEL,
        });
    }

    // celebrate is false when a Mastery Level 10 toast of the same Play
    // already brings the Confetti Shower: one shower per return to the wheel.
    function announceTier(profileName, tier, needed, celebrate) {
        const TEXT = lang.tableMastery;
        const levelName = TEXT.levelNames[tier - 1];
        submitFor(profileName, {
            header: TEXT.collectionToastHeader,
            accent: metalOf(tier),
            tileNumber: tier,
            title: TEXT.collectionToastTitle(tier, levelName),
            description: TEXT.collectionToastDescription(needed, levelName),
            celebrate,
        });
    }

    // Kept only once a tier is reached: a Profile Reset drops the key.
    function raiseCollectionTier(profileName, celebrate) {
        const tables = tablesVisibleTo(host.getVisibleTables(), store, profileName);
        const data = store.getProfileDataOf(profileName);
        const keptTier = data.collectionTier || 0;
        const { tier, needed } = collectionMasteryOfProfile(tables, data);
        if (tier <= keptTier) return;
        store.updateProfileData(data => { data.collectionTier = tier; }, profileName);
        announceTier(profileName, tier, needed, celebrate);
    }

    // The totals already count the Play when it is announced.
    store.onPlay(safeHandler(SCRIPT_NAME, ({ profileName, configId, seconds }) => {
        const play = store.getPlaysOf(profileName)[configId];
        if (movedByPlay(play, seconds)) movedTable = { profileName, configId };
        const level = levelReachedByPlay(play, seconds);
        if (level !== null) announceLevel(profileName, configId, level);
        raiseCollectionTier(profileName, level !== MAX_MASTERY_LEVEL);
    }));

    // Fires on every wheel move, the player's and attract mode's alike.
    host.onGameListEvent("gameselect", safeHandler(SCRIPT_NAME, ev => showTable(ev.game)));
    // Never over a game, like the Challenge Card.
    host.on("gamestarted", safeHandler(SCRIPT_NAME, () => {
        gameRunning = true;
        bar.hide();
    }));
    // Back on the wheel after a game, a menu or a dialog.
    host.on("wheelmode", safeHandler(SCRIPT_NAME, () => {
        gameRunning = false;
        showOnReturn();
    }));
    store.onSwitch(safeHandler(SCRIPT_NAME, showCurrent));

    showCurrent();
}
