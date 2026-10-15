// ============================================================
// Compound file writer for the tests: builds the bytes of a VPReg.stg
// from { section: { value: text } }, each value written as UTF-16LE text
// in the mini stream, as VPX's SaveValue does. Version 3 (512-byte
// sectors), siblings chained by their right link, every value under the
// 4096-byte mini stream cutoff. Never loaded by PinballY.
// ============================================================

const SECTOR_SIZE = 512;
const MINI_SECTOR_SIZE = 64;
const MINI_STREAM_CUTOFF = 4096;
const ENTRY_SIZE = 128;
const END_OF_CHAIN = 0xFFFFFFFE;
const FAT_SECTOR = 0xFFFFFFFD;
const FREE = 0xFFFFFFFF;
const NO_ENTRY = 0xFFFFFFFF;

const utf16 = (text) => {
    const bytes = new Uint8Array(text.length * 2);
    for (let index = 0; index < text.length; index++) {
        bytes[index * 2] = text.charCodeAt(index) & 0xFF;
        bytes[index * 2 + 1] = text.charCodeAt(index) >> 8;
    }
    return bytes;
};
const sectorsFor = (size, sectorSize) => Math.ceil(size / sectorSize);

export function writeCompoundFile(sections) {
    // Directory entries: the root, then each section followed by its values.
    const entries = [{ name: "Root Entry", type: 5, child: NO_ENTRY, right: NO_ENTRY, start: END_OF_CHAIN, size: 0 }];
    const miniChunks = [];
    const miniFat = [];
    let previousSection = null;
    for (const [sectionName, values] of Object.entries(sections)) {
        const section = { name: sectionName, type: 1, child: NO_ENTRY, right: NO_ENTRY, start: 0, size: 0 };
        const sectionId = entries.push(section) - 1;
        if (previousSection) previousSection.right = sectionId;
        else entries[0].child = sectionId;
        previousSection = section;
        let previousValue = null;
        for (const [valueName, text] of Object.entries(values)) {
            const data = utf16(text);
            if (data.length >= MINI_STREAM_CUTOFF) throw new Error(`Value too long for the test writer: ${valueName}`);
            const count = sectorsFor(data.length, MINI_SECTOR_SIZE);
            const start = count === 0 ? END_OF_CHAIN : miniFat.length;
            for (let index = 0; index < count; index++) miniFat.push(index === count - 1 ? END_OF_CHAIN : miniFat.length + 1);
            const padded = new Uint8Array(count * MINI_SECTOR_SIZE);
            padded.set(data);
            miniChunks.push(padded);
            const value = { name: valueName, type: 2, child: NO_ENTRY, right: NO_ENTRY, start, size: data.length };
            const valueId = entries.push(value) - 1;
            if (previousValue) previousValue.right = valueId;
            else section.child = valueId;
            previousValue = value;
        }
    }
    const miniStreamSize = miniChunks.reduce((total, chunk) => total + chunk.length, 0);

    // Layout: FAT sectors, then the mini FAT, the directory and the mini stream.
    const miniFatSectors = sectorsFor(miniFat.length * 4, SECTOR_SIZE);
    const directorySectors = sectorsFor(entries.length * ENTRY_SIZE, SECTOR_SIZE);
    const miniStreamSectors = sectorsFor(miniStreamSize, SECTOR_SIZE);
    const dataSectors = miniFatSectors + directorySectors + miniStreamSectors;
    let fatSectors = 1;
    while (fatSectors * (SECTOR_SIZE / 4) < fatSectors + dataSectors) fatSectors++;
    if (fatSectors > 109) throw new Error("Too many sections for the test writer.");

    const fat = [];
    for (let index = 0; index < fatSectors; index++) fat.push(FAT_SECTOR);
    const chain = (count) => {
        const start = count === 0 ? END_OF_CHAIN : fat.length;
        for (let index = 0; index < count; index++) fat.push(index === count - 1 ? END_OF_CHAIN : fat.length + 1);
        return start;
    };
    const miniFatStart = chain(miniFatSectors);
    const directoryStart = chain(directorySectors);
    const miniStreamStart = chain(miniStreamSectors);
    entries[0].start = miniStreamStart;
    entries[0].size = miniStreamSize;

    const totalSectors = fatSectors + dataSectors;
    const bytes = new Uint8Array(SECTOR_SIZE * (totalSectors + 1));
    const view = new DataView(bytes.buffer);
    const offsetOf = sector => (sector + 1) * SECTOR_SIZE;

    bytes.set([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);
    view.setUint16(0x18, 0x3E, true);
    view.setUint16(0x1A, 3, true);
    view.setUint16(0x1C, 0xFFFE, true);
    view.setUint16(0x1E, 9, true);
    view.setUint16(0x20, 6, true);
    view.setUint32(0x2C, fatSectors, true);
    view.setUint32(0x30, directoryStart, true);
    view.setUint32(0x38, MINI_STREAM_CUTOFF, true);
    view.setUint32(0x3C, miniFatStart, true);
    view.setUint32(0x40, miniFatSectors, true);
    view.setUint32(0x44, END_OF_CHAIN, true);
    view.setUint32(0x48, 0, true);
    for (let index = 0; index < 109; index++) view.setUint32(0x4C + index * 4, index < fatSectors ? index : FREE, true);

    for (let index = 0; index < fatSectors * (SECTOR_SIZE / 4); index++) {
        view.setUint32(offsetOf(0) + index * 4, index < fat.length ? fat[index] : FREE, true);
    }
    for (let index = 0; index < miniFatSectors * (SECTOR_SIZE / 4); index++) {
        view.setUint32(offsetOf(miniFatStart) + index * 4, index < miniFat.length ? miniFat[index] : FREE, true);
    }
    entries.forEach((entry, index) => {
        const at = offsetOf(directoryStart) + index * ENTRY_SIZE;
        bytes.set(utf16(entry.name), at);
        view.setUint16(at + 0x40, (entry.name.length + 1) * 2, true);
        bytes[at + 0x42] = entry.type;
        bytes[at + 0x43] = 1;
        view.setUint32(at + 0x44, NO_ENTRY, true);
        view.setUint32(at + 0x48, entry.right, true);
        view.setUint32(at + 0x4C, entry.child, true);
        view.setUint32(at + 0x74, entry.start, true);
        view.setUint32(at + 0x78, entry.size, true);
    });
    // The unused entries of the last directory sector are empty, with no siblings.
    for (let index = entries.length; index < directorySectors * (SECTOR_SIZE / ENTRY_SIZE); index++) {
        const at = offsetOf(directoryStart) + index * ENTRY_SIZE;
        view.setUint32(at + 0x44, NO_ENTRY, true);
        view.setUint32(at + 0x48, NO_ENTRY, true);
        view.setUint32(at + 0x4C, NO_ENTRY, true);
    }
    let at = offsetOf(miniStreamStart);
    for (const chunk of miniChunks) {
        bytes.set(chunk, at);
        at += chunk.length;
    }
    return bytes;
}
