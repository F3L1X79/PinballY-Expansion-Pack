// ============================================================
// Default Score images: the placeholder images the High Score Board shows
// in place of an Avatar for its Default Scores, picked by their initials
// among the pack's default_score_01.png to default_score_10.png in
// assets\images\default_scores\, those present and readable only. The same
// initials always get the same image, whatever the table; on one board,
// different initials share one only once none is free. Reads the folder
// and logs an unreadable image, or none at all; draws nothing.
// ============================================================

export const DEFAULT_SCORE_IMAGES_FOLDER = "assets\\images\\default_scores";
const IMAGE_COUNT = 10;

const fileOf = number => `default_score_${String(number).padStart(2, "0")}.png`;
// Initials are the same in any case, as the High Score store's places.
const keyOf = initials => initials.toUpperCase();

// 32-bit FNV-1a: spreads initials that differ by one letter over the images.
function hashOf(text) {
    let hash = 0x811C9DC5;
    for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193);
    return hash >>> 0;
}

// The paths of the present and readable images, in their numbers' order.
// log: one line per image left out as unreadable, one when none is left.
export function readDefaultScoreImages(host, log) {
    const folder = `${host.getProjectFolder()}\\${DEFAULT_SCORE_IMAGES_FOLDER}`;
    const present = new Set(host.files.listFiles(folder));
    const images = [];
    for (let number = 1; number <= IMAGE_COUNT; number++) {
        if (!present.has(fileOf(number))) continue;
        const path = `${folder}\\${fileOf(number)}`;
        if (host.files.isImageReadable(path)) images.push(path);
        else log(`${path} is unreadable; Default Scores show without it.`);
    }
    if (images.length === 0) log(`No Default Score image in ${folder}; Default Scores show without one.`);
    return images;
}

// One board's Default Scores' initials, in any order, to a function giving
// the image of any of them (null without images). Each initials take their
// hash's image; when several want the same one, the first in alphabetical
// order keeps it and the others take the next image no initials of the
// board wanted or took. Initials no others contest so keep their image on
// every board.
export function pickDefaultScoreImages(initialsList, images) {
    const picked = new Map();
    if (images.length > 0) {
        const keys = [...new Set(initialsList.map(keyOf))].sort();
        const firstChoiceOf = key => hashOf(key) % images.length;
        const taken = new Set(keys.map(firstChoiceOf));
        const kept = new Set();
        const moved = [];
        for (const key of keys) {
            const index = firstChoiceOf(key);
            if (kept.has(index)) moved.push(key);
            else {
                kept.add(index);
                picked.set(key, index);
            }
        }
        for (const key of moved) {
            let index = firstChoiceOf(key);
            // Shared only once every image is taken.
            if (taken.size < images.length) {
                while (taken.has(index)) index = (index + 1) % images.length;
            }
            taken.add(index);
            picked.set(key, index);
        }
    }
    return initials => (picked.has(keyOf(initials)) ? images[picked.get(keyOf(initials))] : null);
}
