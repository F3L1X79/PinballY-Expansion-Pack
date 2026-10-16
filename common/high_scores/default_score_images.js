// ============================================================
// Default Score images: the placeholder images the High Score Board shows
// in place of an Avatar for its Default Scores, picked by their initials
// among the numbered default_score_NN.png of assets\images\default_scores\
// and of its local\ folder (the owner's own, kept out of git), those
// readable only. The same initials always get the same image, whatever the
// table, as long as the images stay the same; on one board, different
// initials share one only once none is free. Reads both folders and logs
// an unreadable image, or none at all; draws nothing.
// ============================================================

export const DEFAULT_SCORE_IMAGES_FOLDER = "assets\\images\\default_scores";
// Any other file there, such as the sheet the images were cut from, is left out.
const IMAGE_FILE = /^default_score_(\d+)\.png$/i;
// Initials are the same in any case, as the High Score store's places.
const keyOf = initials => initials.toUpperCase();

// 32-bit FNV-1a: spreads initials that differ by one letter over the images.
function hashOf(text) {
    let hash = 0x811C9DC5;
    for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193);
    return hash >>> 0;
}

// The paths of the readable images, the pack's then the local ones, each
// in their numbers' order.
// log: one line per image left out as unreadable, one when none is left.
export function readDefaultScoreImages(host, log) {
    const folder = `${host.getProjectFolder()}\\${DEFAULT_SCORE_IMAGES_FOLDER}`;
    const numbered = folderPath => host.files.listFiles(folderPath)
        .filter(name => IMAGE_FILE.test(name))
        .sort((a, b) => Number(IMAGE_FILE.exec(a)[1]) - Number(IMAGE_FILE.exec(b)[1]))
        .map(name => `${folderPath}\\${name}`);
    const images = [];
    for (const path of [...numbered(folder), ...numbered(`${folder}\\local`)]) {
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
