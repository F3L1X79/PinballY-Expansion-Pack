// ============================================================
// Achievement Toast module: announces each unlocked Achievement with a
// small Steam-like card in the bottom-right corner of the playfield window,
// drawn on a main-window drawing layer above menus and popups (see
// docs/adr/0003). It takes no input and leaves on its own: it rises from
// the bottom edge, holds a few seconds, then fades out. Cards stack, the
// newest at the bottom, arrive staggered, at most five on screen, and
// the oldest leaves first. Toasts wait while a game starts, runs or exits;
// waiting ones start on "wheelmode". The hold duration and an optional
// sound played with each card and the card's scale come from the player
// settings. An Achievement Toast shows its Achievement Rank's emblem in
// the Rank's colour, or the trophy when that emblem's file is missing
// (logged once). A Challenge Toast shares the queue and the card, with its
// own accent colour, header and target icon instead of the trophy; a Mastery
// Toast its own header, the reached level's metal as its accent and the
// level's number drawn in its tile. A celebrated toast starts the
// Confetti Shower when it starts.
// ============================================================

import lang from "./i18n.js";
import { safeHandler } from "./safe_handler.js";
import { createPinballYHost } from "./pinbally_host.js";
import config from "./config.js";
import { STEAMBALL_COLORS, STEAMBALL_FONTS, RANK_COLORS } from "./steamball_palette.js";
import { getConfettiShower } from "./confetti_shower.js";

const SCRIPT_NAME = "AchievementToast";

// Above PinballY's menus and popups. Exported for the tests' reader.
export const ACHIEVEMENT_TOAST_Z_INDEX = 6500;
const FRAME_MS = 16;
const DEFAULT_TOAST_SECONDS = 4;
const MAX_TOAST_SECONDS = 60;
const FADE_MS = 250;
// Fraction of the remaining distance covered each frame while rising (ease-out).
const RISE_EASE = 0.2;
const ARRIVAL_GAP_MS = 350;
const MAX_CARDS = 5;

// Card look at scale 1, validated with a prototype in PinballY; sizes in
// pixels, fonts in points. The player's scale multiplies all of them.
const BASE_LOOK = Object.freeze({
    cardWidth: 440,
    border: 1,
    edgeMargin: 24,
    stackGap: 10,
    paddingY: 22,
    paddingRight: 14,
    accentBarWidth: 5,
    tileSize: 64,
    tileGap: 20,
    tileFrame: 3,
    iconInset: 10,
    // One-pixel frames, so the glow widens with the tile.
    glowRings: 10,
    smallFont: 11,
    titleFont: 13,
});
// The validated card, unscaled; a player enlarges it with ACHIEVEMENT_TOAST_SCALE.
const DEFAULT_TOAST_SCALE = 1;
// Below it, the tile frame and the small font round down to nothing.
const MIN_TOAST_SCALE = 0.5;
const MAX_TOAST_SCALE = 3;
const GLOW_MAX_ALPHA = 0x38;
const FONT = STEAMBALL_FONTS.body;
// The number drawn in place of an icon, as a share of the tile.
const TILE_NUMBER_SHARE = 0.5;
const COLORS = Object.freeze({
    gradientTop: STEAMBALL_COLORS.panelTop,
    gradientBottom: STEAMBALL_COLORS.panel,
    border: STEAMBALL_COLORS.border,
    tile: STEAMBALL_COLORS.tile,
    title: STEAMBALL_COLORS.title,
    description: STEAMBALL_COLORS.description,
    transparent: STEAMBALL_COLORS.transparent,
});

export const TOAST_KIND = Object.freeze({ ACHIEVEMENT: "achievement", CHALLENGE: "challenge", MASTERY: "mastery" });

// Icons in the pack's assets folder, drawn by absolute path: drawImage
// resolves relative paths from the PinballY folder, not the pack's.
const KIND_LOOKS = Object.freeze({
    [TOAST_KIND.ACHIEVEMENT]: {
        accent: STEAMBALL_COLORS.gold,
        iconFile: "assets\\achievement_trophy.png",
        header: () => lang.achievements.toastHeader,
    },
    // The Challenge Card's accent, so the toast reads as the card's news.
    [TOAST_KIND.CHALLENGE]: {
        accent: STEAMBALL_COLORS.challengeAccent,
        iconFile: "assets\\challenge_target.png",
        header: () => lang.challenges.toastHeader,
    },
    // No icon: each toast brings its accent and the number its tile shows.
    [TOAST_KIND.MASTERY]: {
        header: () => lang.tableMastery.toastHeader,
    },
});

function mixColors(from, to, ratio) {
    let color = 0;
    for (const shift of [24, 16, 8, 0]) {
        const start = (from >>> shift) & 0xFF;
        const end = (to >>> shift) & 0xFF;
        color += Math.round(start + (end - start) * ratio) * 2 ** shift;
    }
    return color;
}

// Drawn as one-pixel rows: the drawing context has no gradient fill.
function fillGradient(dc, x, y, width, height, topColor, bottomColor) {
    for (let row = 0; row < height; row++) {
        dc.fillRect(x, y + row, width, 1, mixColors(topColor, bottomColor, row / Math.max(1, height - 1)));
    }
}

const scaleLook = scale => Object.freeze(Object.fromEntries(
    Object.entries(BASE_LOOK).map(([name, size]) => [name, Math.round(size * scale)])));

// Dark tile with an accent frame, a soft accent glow made of fading
// frames, and the icon, or else the number in the accent.
function drawTile(host, dc, look, x, y, accent, { iconPath, number }) {
    const { tileSize, glowRings, iconInset } = look;
    const accentRgb = accent & 0xFFFFFF;
    for (let ring = glowRings; ring >= 1; ring--) {
        const alpha = Math.round(GLOW_MAX_ALPHA * (1 - ring / (glowRings + 1)));
        dc.frameRect(x - ring, y - ring, tileSize + 2 * ring, tileSize + 2 * ring, 1, alpha * 2 ** 24 + accentRgb);
    }
    dc.fillRect(x, y, tileSize, tileSize, COLORS.tile);
    dc.frameRect(x, y, tileSize, tileSize, look.tileFrame, accent);
    if (iconPath) {
        dc.drawImage(iconPath, x + iconInset, y + iconInset, tileSize - 2 * iconInset, tileSize - 2 * iconInset);
        return;
    }
    const text = host.createStyledText({
        textAlign: "center",
        textStyle: { font: STEAMBALL_FONTS.display, size: Math.round(tileSize * TILE_NUMBER_SHARE), weight: 700, color: accent },
    });
    text.add(String(number));
    const height = text.measure(tileSize).height;
    text.draw(dc, { x, y: y + (tileSize - height) / 2, width: tileSize, height });
}

// Draws the card flush with the bottom-right corner of the layer's layout
// (rotation-aware) and returns its height and the layout height.
// Backgrounds use fillRect and frameRect: a StyledText holding only a
// space draws no background.
// iconPathOf(toast, iconFile): the absolute path of the tile's icon.
function drawCard(host, dc, look, toast, iconPathOf) {
    const { cardWidth, edgeMargin, accentBarWidth, tileSize, tileGap, smallFont } = look;
    const kindLook = KIND_LOOKS[toast.kind || TOAST_KIND.ACHIEVEMENT];
    const accent = toast.accent || RANK_COLORS[toast.rank] || kindLook.accent;
    const size = dc.getSize();
    const textLeft = accentBarWidth + tileGap + tileSize + tileGap;
    const textWidth = cardWidth - textLeft - look.paddingRight;
    const text = host.createStyledText({ textStyle: { font: FONT, size: smallFont, color: COLORS.description } });
    text.add({ size: smallFont, weight: 600, color: accent, text: kindLook.header().toLocaleUpperCase() + "\n" });
    text.add({ size: look.titleFont, weight: 600, color: COLORS.title, text: toast.title + "\n" });
    text.add(toast.description);
    const textHeight = text.measure(textWidth).height;
    const height = Math.max(textHeight, tileSize) + 2 * look.paddingY;
    const x = size.width - cardWidth - edgeMargin;
    const y = size.height - height - edgeMargin;

    fillGradient(dc, x, y, cardWidth, height, COLORS.gradientTop, COLORS.gradientBottom);
    dc.frameRect(x, y, cardWidth, height, look.border, COLORS.border);
    dc.fillRect(x, y, accentBarWidth, height, accent);
    drawTile(host, dc, look, x + accentBarWidth + tileGap, y + (height - tileSize) / 2, accent, kindLook.iconFile
        ? { iconPath: iconPathOf(toast, kindLook.iconFile) }
        : { number: toast.tileNumber });
    text.draw(dc, { x: x + textLeft, y: y + (height - textHeight) / 2, width: textWidth, height: textHeight });
    return { height, layoutHeight: size.height };
}

// Seconds a card stays fully visible; an absurd value falls back to the default.
function toHoldMs(toastSeconds) {
    if (toastSeconds > 0 && toastSeconds <= MAX_TOAST_SECONDS) return toastSeconds * 1000;
    logfile.log(`[${SCRIPT_NAME}] achievementToastSeconds must be above 0 and at most ${MAX_TOAST_SECONDS}, `
        + `not ${toastSeconds}; using ${DEFAULT_TOAST_SECONDS}.`);
    return DEFAULT_TOAST_SECONDS * 1000;
}

// An absurd scale falls back to the default.
function toScale(scale) {
    if (scale >= MIN_TOAST_SCALE && scale <= MAX_TOAST_SCALE) return scale;
    logfile.log(`[${SCRIPT_NAME}] achievementToastScale must be from ${MIN_TOAST_SCALE} to ${MAX_TOAST_SCALE}, `
        + `not ${scale}; using ${DEFAULT_TOAST_SCALE}.`);
    return DEFAULT_TOAST_SCALE;
}

// soundFile: absolute path played at the start of each card, empty for none.
// confettiShower: started by a celebrated toast; the tests may leave it out.
export function createAchievementToasts(host, {
    toastSeconds = DEFAULT_TOAST_SECONDS, soundFile = "", scale = DEFAULT_TOAST_SCALE, confettiShower = { start() {} },
} = {}) {
    const holdMs = toHoldMs(toastSeconds);
    const look = scaleLook(toScale(scale));
    // A sound that cannot play is logged and never stops the card.
    const playSound = safeHandler(SCRIPT_NAME, () => { if (soundFile) host.playSound(soundFile); });
    // A shower that fails is logged and never stops the card.
    const celebrate = safeHandler(SCRIPT_NAME, () => confettiShower.start());
    const waiting = [];
    const projectFolder = host.getProjectFolder();
    // Each Rank's emblem path, or null when its file is missing: checked once.
    const rankEmblems = new Map();
    // Cards on screen, oldest first. Each one: its layer, its height, the
    // layout height, its lift above the bottom slot (layout pixels, up is
    // positive), its alpha and whether it is leaving.
    const cards = [];
    // Layers of cards that left, kept for the next ones.
    const freeLayers = [];
    let frameTimer = null;
    // False for ARRIVAL_GAP_MS after a card arrives, so a batch arrives staggered.
    let arrivalOpen = true;

    // The emblem with its halo: the list's rows use the plain one, too
    // small for a halo, while the toast's tile frames it like the trophy.
    function rankEmblemOf(rank) {
        if (!rankEmblems.has(rank)) {
            const path = `${projectFolder}\\assets\\rank_${rank}.png`;
            const exists = host.files.fileExists(path);
            if (!exists) host.log(`[${SCRIPT_NAME}] Rank emblem not found, drawing the trophy instead: ${path}`);
            rankEmblems.set(rank, exists ? path : null);
        }
        return rankEmblems.get(rank);
    }

    // An Achievement Toast's Rank emblem, else the kind's icon.
    function iconPathOf(toast, iconFile) {
        return (toast.rank && rankEmblemOf(toast.rank)) || `${projectFolder}\\${iconFile}`;
    }

    function placeLayer(card) {
        card.layer.alpha = card.alpha;
        card.layer.setPos(0, card.lift / card.layoutHeight);
    }

    function startFrames() {
        if (frameTimer === null) frameTimer = host.setInterval(safeHandler(SCRIPT_NAME, step), FRAME_MS);
    }

    function stopFrames() {
        host.clearInterval(frameTimer);
        frameTimer = null;
    }

    // Every card's slot sits above the newer cards below it.
    function targetLift(index) {
        let lift = 0;
        for (let newer = index + 1; newer < cards.length; newer++) lift += cards[newer].height + look.stackGap;
        return lift;
    }

    function startLeaving(card) {
        card.leaving = true;
        startFrames();
    }

    // Runs every frame while a card rises, eases up or fades, then stops.
    function step() {
        let moving = false;
        cards.forEach((card, index) => {
            const remaining = targetLift(index) - card.lift;
            if (Math.abs(remaining) * (1 - RISE_EASE) >= 0.5) {
                card.lift += remaining * RISE_EASE;
                moving = true;
            } else card.lift += remaining;
            if (card.leaving) {
                card.alpha = Math.max(0, card.alpha - FRAME_MS / FADE_MS);
                moving = true;
            }
            placeLayer(card);
        });
        if (cards.length > 0 && cards[0].leaving && cards[0].alpha === 0) {
            const gone = cards.shift();
            gone.layer.clear(COLORS.transparent);
            freeLayers.push(gone.layer);
            showNext();
            moving = true;
        }
        if (!moving) stopFrames();
    }

    function openArrival() {
        arrivalOpen = true;
        showNext();
    }

    function showNext() {
        // A toast gone stale while it waited (its Profile was reset) never shows.
        while (waiting.length > 0 && waiting[0].isStale && waiting[0].isStale()) waiting.shift();
        if (!arrivalOpen || cards.length >= MAX_CARDS || waiting.length === 0) return;
        // PinballY stops redrawing its window while a game starts, runs or
        // exits, and the game covers it.
        if (host.getFullUIMode().runMode !== undefined) return;

        const toast = waiting.shift();
        const layer = freeLayers.pop() || host.createDrawingLayer(ACHIEVEMENT_TOAST_Z_INDEX);
        let drawn = null;
        layer.draw(dc => { drawn = drawCard(host, dc, look, toast, iconPathOf); });
        // Starts just below the bottom edge, then rises into place.
        const card = {
            layer, height: drawn.height, layoutHeight: drawn.layoutHeight,
            lift: -(drawn.height + look.edgeMargin), alpha: 1, leaving: false,
        };
        cards.push(card);
        placeLayer(card);
        // Every card holds as long from its arrival: the oldest leaves first.
        host.setTimeout(safeHandler(SCRIPT_NAME, () => startLeaving(card)), holdMs);
        arrivalOpen = false;
        host.setTimeout(safeHandler(SCRIPT_NAME, openArrival), ARRIVAL_GAP_MS);
        // Animated before onShown, so a failing callback never leaves the card stuck on screen.
        startFrames();
        if (toast.celebrate) celebrate();
        playSound();
        toast.onShown();
    }

    const safeShowNext = safeHandler(SCRIPT_NAME, showNext);

    // Fires on every return to the wheel: starts the toasts that waited for a game.
    host.on("wheelmode", safeShowNext);

    // toast: { kind, title, description, onShown, isStale, celebrate,
    // rank, accent, tileNumber }, kind a TOAST_KIND (an Achievement when
    // missing), rank (optional) the Achievement Rank of an Achievement
    // Toast, onShown running when the toast starts, isStale (optional)
    // dropping it unshown when it returns true at its turn, celebrate
    // (optional) starting the Confetti Shower with it; a Mastery Toast
    // gives its accent and the number its tile shows.
    function submit(toast) {
        waiting.push(toast);
        safeShowNext();
    }

    return { submit };
}

let sharedAchievementToasts = null;

export function getAchievementToasts() {
    if (!sharedAchievementToasts) {
        sharedAchievementToasts = createAchievementToasts(createPinballYHost(), {
            toastSeconds: config.achievementToastSeconds,
            soundFile: config.achievementSoundFile,
            scale: config.achievementToastScale,
            confettiShower: getConfettiShower(),
        });
    }
    return sharedAchievementToasts;
}
