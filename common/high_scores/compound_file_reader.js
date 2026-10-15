// ============================================================
// Compound file reader: decodes a compound file held in memory (the
// format of Visual Pinball X's VPReg.stg) into its storages and the
// streams inside them: { section: { value: text } }, each stream read as
// UTF-16LE text, the way VPX's SaveValue writes it. Throws on bytes that
// are not a compound file. Pure: reads no PinballY global, writes nothing.
// ============================================================

const SIGNATURE = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1];
const HEADER_DIFAT_ENTRIES = 109;
const DIRECTORY_ENTRY_SIZE = 128;
const STORAGE = 1;
const STREAM = 2;
// Sector numbers from MAXREGSECT up end a chain or mark a free sector.
const MAX_REGULAR_SECTOR = 0xFFFFFFFA;
const NO_ENTRY = 0xFFFFFFFF;

export function readCompoundFile(bytes) {
    if (bytes.length < 512 || SIGNATURE.some((byte, index) => bytes[index] !== byte)) {
        throw new Error("VPReg.stg is not a compound file.");
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const u16 = offset => view.getUint16(offset, true);
    const u32 = offset => view.getUint32(offset, true);
    const sectorSize = 1 << u16(0x1E);
    const miniSectorSize = 1 << u16(0x20);
    const miniStreamCutoff = u32(0x38);
    const sectorOffset = sector => (sector + 1) * sectorSize;
    const entriesPerSector = sectorSize / 4;

    // The sectors holding the FAT: 109 in the header, the rest in a chain of DIFAT sectors.
    const fatSectors = [];
    for (let index = 0; index < HEADER_DIFAT_ENTRIES; index++) fatSectors.push(u32(0x4C + index * 4));
    for (let sector = u32(0x44), count = u32(0x48); count > 0 && sector <= MAX_REGULAR_SECTOR; count--) {
        for (let index = 0; index < entriesPerSector - 1; index++) fatSectors.push(u32(sectorOffset(sector) + index * 4));
        sector = u32(sectorOffset(sector) + (entriesPerSector - 1) * 4);
    }
    const fat = [];
    for (const sector of fatSectors.slice(0, u32(0x2C))) {
        for (let index = 0; index < entriesPerSector; index++) fat.push(u32(sectorOffset(sector) + index * 4));
    }

    // The sectors of a chain, in order; a loop or an out-of-range sector is a broken file.
    function chainOf(start, table) {
        const sectors = [];
        for (let sector = start; sector <= MAX_REGULAR_SECTOR; sector = table[sector]) {
            if (sector >= table.length || sectors.length > table.length) throw new Error("VPReg.stg has a broken sector chain.");
            sectors.push(sector);
        }
        return sectors;
    }
    function readChain(start) {
        const sectors = chainOf(start, fat);
        const data = new Uint8Array(sectors.length * sectorSize);
        sectors.forEach((sector, index) => data.set(bytes.subarray(sectorOffset(sector), sectorOffset(sector) + sectorSize), index * sectorSize));
        return data;
    }

    const directory = readChain(u32(0x30));
    const directoryView = new DataView(directory.buffer);
    const entryCount = directory.length / DIRECTORY_ENTRY_SIZE;
    function entryAt(id) {
        const at = id * DIRECTORY_ENTRY_SIZE;
        const nameBytes = Math.max(directoryView.getUint16(at + 0x40, true) - 2, 0);
        let name = "";
        for (let offset = 0; offset < nameBytes; offset += 2) name += String.fromCharCode(directoryView.getUint16(at + offset, true));
        return {
            name,
            type: directory[at + 0x42],
            left: directoryView.getUint32(at + 0x44, true),
            right: directoryView.getUint32(at + 0x48, true),
            child: directoryView.getUint32(at + 0x4C, true),
            start: directoryView.getUint32(at + 0x74, true),
            size: directoryView.getUint32(at + 0x78, true),
        };
    }
    // The entries of a storage: its child and that child's siblings, a tree walked in any order.
    function childrenOf(entry) {
        const found = [];
        const pending = [entry.child];
        while (pending.length > 0) {
            const id = pending.pop();
            if (id === NO_ENTRY) continue;
            if (id >= entryCount || found.length > entryCount) throw new Error("VPReg.stg has a broken directory.");
            const child = entryAt(id);
            found.push(child);
            pending.push(child.left, child.right);
        }
        return found;
    }

    const root = entryAt(0);
    const miniStream = readChain(root.start);
    const miniFat = [];
    if (u32(0x40) > 0) {
        const miniFatBytes = readChain(u32(0x3C));
        const miniFatView = new DataView(miniFatBytes.buffer);
        for (let offset = 0; offset < miniFatBytes.length; offset += 4) miniFat.push(miniFatView.getUint32(offset, true));
    }
    function streamBytes(entry) {
        if (entry.size >= miniStreamCutoff) return readChain(entry.start).subarray(0, entry.size);
        const data = new Uint8Array(entry.size);
        chainOf(entry.start, miniFat).forEach((sector, index) => {
            const chunk = miniStream.subarray(sector * miniSectorSize, (sector + 1) * miniSectorSize);
            data.set(chunk.subarray(0, Math.max(Math.min(miniSectorSize, entry.size - index * miniSectorSize), 0)), index * miniSectorSize);
        });
        return data;
    }
    function utf16Text(data) {
        let text = "";
        for (let offset = 0; offset + 1 < data.length; offset += 2) text += String.fromCharCode(data[offset] | (data[offset + 1] << 8));
        return text;
    }

    const sections = {};
    for (const storage of childrenOf(root).filter(entry => entry.type === STORAGE)) {
        const values = {};
        for (const stream of childrenOf(storage).filter(entry => entry.type === STREAM)) values[stream.name] = utf16Text(streamBytes(stream));
        sections[storage.name] = values;
    }
    return sections;
}
